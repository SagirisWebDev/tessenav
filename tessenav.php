<?php
/**
 * Plugin Name:       TesseNav
 * Description:       Build navigation with rich submenus — text, media, columns, and any layout block inside the WordPress Navigation block.
 * Version:           0.1.0
 * Requires at least: 6.7
 * Requires PHP:      7.4
 * Author:            Sagiris Web Development
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       tessenav
 *
 * @package Sagiriswd
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

define( 'TESSENAV_GRACE_PERIOD_DAYS', 30 );

// Lemon Squeezy store + variant IDs for TesseNav Premium. Variant IDs are the
// durable identifiers for each pricing tier in LS — keep in sync with the
// variants configured in the dashboard (product ID 1153171).
define( 'TESSENAV_LS_STORE_SLUG', 'sagiriswd' );
define( 'TESSENAV_LS_PRODUCT_ID', 1153171 );
define( 'TESSENAV_LS_VARIANT_SINGLE_SITE', 1820866 );
define( 'TESSENAV_LS_VARIANT_UNLIMITED',   1804446 );
define( 'TESSENAV_LS_VARIANT_LIFETIME',    1820856 );

// Default upgrade target — the unlimited annual tier (best value for the
// typical buyer hitting the 4th-submenu gate). The per-tier map is exposed to
// JS via tessenavSettings.checkoutUrls.
define(
	'TESSENAV_UPGRADE_URL',
	sprintf(
		'https://%s.lemonsqueezy.com/checkout/buy/%d',
		TESSENAV_LS_STORE_SLUG,
		TESSENAV_LS_VARIANT_UNLIMITED
	)
);

require_once __DIR__ . '/includes/license-validator.php';
require_once __DIR__ . '/includes/admin-settings.php';

/**
 * Returns the LS checkout URL for a given TesseNav Premium tier.
 *
 * @param string $tier One of 'single_site' | 'unlimited' | 'lifetime'.
 * @return string Checkout URL, or empty string if the tier is unknown.
 */
function sagiriswd_tessenav_checkout_url( $tier ) {
	$variant_id = sagiriswd_tessenav_variant_id_for_tier( $tier );
	if ( ! $variant_id ) {
		return '';
	}
	return sprintf(
		'https://%s.lemonsqueezy.com/checkout/buy/%d',
		TESSENAV_LS_STORE_SLUG,
		$variant_id
	);
}

/**
 * Returns the full per-tier checkout URL map. Surfaced to JS for the upsell
 * card so it can build per-tier CTAs without round-tripping to PHP.
 *
 * @return array<string,string>
 */
function sagiriswd_tessenav_checkout_urls() {
	return array(
		'single_site' => sagiriswd_tessenav_checkout_url( 'single_site' ),
		'unlimited'   => sagiriswd_tessenav_checkout_url( 'unlimited' ),
		'lifetime'    => sagiriswd_tessenav_checkout_url( 'lifetime' ),
	);
}

/**
 * Maps tier slug → variant ID.
 *
 * @param string $tier
 * @return int|null
 */
function sagiriswd_tessenav_variant_id_for_tier( $tier ) {
	$map = array(
		'single_site' => TESSENAV_LS_VARIANT_SINGLE_SITE,
		'unlimited'   => TESSENAV_LS_VARIANT_UNLIMITED,
		'lifetime'    => TESSENAV_LS_VARIANT_LIFETIME,
	);
	return $map[ $tier ] ?? null;
}

/**
 * Reverse lookup — variant ID → tier slug. Used when LS returns
 * meta.variant_id on activation so we can stamp the stored license with its
 * tier.
 *
 * @param int $variant_id LS variant numeric ID.
 * @return string|null 'single_site' | 'unlimited' | 'lifetime' | null.
 */
function sagiriswd_tessenav_tier_for_variant_id( $variant_id ) {
	$map = array(
		TESSENAV_LS_VARIANT_SINGLE_SITE => 'single_site',
		TESSENAV_LS_VARIANT_UNLIMITED   => 'unlimited',
		TESSENAV_LS_VARIANT_LIFETIME    => 'lifetime',
	);
	return $map[ (int) $variant_id ] ?? null;
}

/**
 * Returns the current premium status for TesseNav.
 *
 * Priority: (1) valid bundle license, (2) valid individual key, (3) grace period, (4) free tier.
 *
 * @return array{ isPremium: bool, inGracePeriod: bool, graceDaysRemaining: int }
 */
function sagiriswd_tessenav_premium_status() {
	$bundle_status   = get_option( 'sagiriswd_bundle_license_status', array( 'valid' => false, 'expiry' => null ) );
	$individual_status = get_option( 'sagiriswd_tessenav_license_status', array( 'valid' => false, 'expiry' => null ) );

	if ( ! empty( $bundle_status['valid'] ) || ! empty( $individual_status['valid'] ) ) {
		return array(
			'isPremium'          => true,
			'inGracePeriod'      => false,
			'graceDaysRemaining' => 0,
		);
	}

	$grace = sagiriswd_tessenav_resolve_grace_period( $bundle_status, $individual_status );

	if ( $grace['inGracePeriod'] ) {
		return array(
			'isPremium'          => false,
			'inGracePeriod'      => true,
			'graceDaysRemaining' => $grace['graceDaysRemaining'],
		);
	}

	return array(
		'isPremium'          => false,
		'inGracePeriod'      => false,
		'graceDaysRemaining' => 0,
	);
}

/**
 * Decides whether a given top-level inner block should be skipped by the free-tier gate.
 *
 * Centralized so both the desktop and navigator render paths apply the same rule:
 * free-tier users render only the first 3 top-level sagiriswd/tessenav-submenu children;
 * premium and grace-period users render all of them.
 *
 * @param string $block_name              The inner block's name.
 * @param int    $top_level_submenu_count The submenu's 1-based position among top-level submenus.
 * @param array  $premium_status          { isPremium: bool, inGracePeriod: bool, graceDaysRemaining: int }
 * @return bool True if the block should be skipped (free-tier, beyond cap).
 */
function sagiriswd_tessenav_is_gated_top_level_submenu( $block_name, $top_level_submenu_count, $premium_status ) {
	if ( 'sagiriswd/tessenav-submenu' !== $block_name ) {
		return false;
	}
	$can_render_all = $premium_status['isPremium'] || $premium_status['inGracePeriod'];
	return ! $can_render_all && $top_level_submenu_count > 3;
}

/**
 * Determines whether either the bundle or individual license is within the 30-day
 * grace period after subscription lapse. Returns the highest days-remaining value.
 *
 * Grace period only applies when a subscription has lapsed (expiry in the past).
 * Manual key removal clears the status option entirely, so expiry will be null
 * and no grace period is granted.
 *
 * @param array $bundle_status     { valid: bool, expiry: int|null }
 * @param array $individual_status { valid: bool, expiry: int|null }
 * @return array{ inGracePeriod: bool, graceDaysRemaining: int }
 */
function sagiriswd_tessenav_resolve_grace_period( $bundle_status, $individual_status ) {
	$best_remaining = 0;
	$now            = time();

	foreach ( array( $bundle_status, $individual_status ) as $status ) {
		if ( empty( $status['expiry'] ) ) {
			continue;
		}
		$expiry = (int) $status['expiry'];
		if ( $now <= $expiry ) {
			continue; // Still within subscription window — not lapsed yet.
		}
		$days_since_expiry = ( $now - $expiry ) / DAY_IN_SECONDS;
		$days_remaining    = (int) ceil( TESSENAV_GRACE_PERIOD_DAYS - $days_since_expiry );
		if ( $days_remaining > 0 ) {
			$best_remaining = max( $best_remaining, $days_remaining );
		}
	}

	return array(
		'inGracePeriod'      => $best_remaining > 0,
		'graceDaysRemaining' => $best_remaining,
	);
}

/**
 * True when the current admin screen is one where TesseNav notices belong:
 * the Dashboard, Plugins page, or the TesseNav license page itself.
 *
 * Scoping notices to these screens (rather than firing on every wp-admin page)
 * satisfies WP.org Plugin Guideline 11's "limited in scope, used sparingly" rule.
 *
 * @return bool
 */
function sagiriswd_tessenav_is_relevant_admin_screen() {
	if ( ! function_exists( 'get_current_screen' ) ) {
		return false;
	}
	$screen = get_current_screen();
	if ( ! $screen ) {
		return false;
	}
	$relevant_ids = array( 'dashboard', 'plugins' );
	if ( in_array( $screen->id, $relevant_ids, true ) ) {
		return true;
	}
	// The TesseNav license page lands as either a Sagiris-menu submenu screen
	// or an options screen depending on whether the parent menu is registered.
	return false !== strpos( $screen->id, 'tessenav-license' );
}

/**
 * Renders an admin notice during the grace period after premium deactivation.
 *
 * Compliance: dismissible (per pageview), scoped to relevant screens only, and
 * downgraded from notice-error to notice-warning. The condition self-resolves
 * when the user renews their license or the grace period ends.
 */
function sagiriswd_tessenav_grace_period_admin_notice() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	if ( ! sagiriswd_tessenav_is_relevant_admin_screen() ) {
		return;
	}

	$status = sagiriswd_tessenav_premium_status();

	if ( ! $status['inGracePeriod'] ) {
		return;
	}

	$days     = $status['graceDaysRemaining'];
	$days_str = sprintf(
		/* translators: %d: number of days remaining */
		_n( '%d day', '%d days', $days, 'tessenav' ),
		$days
	);
	$upgrade_url = esc_url( TESSENAV_UPGRADE_URL );

	printf(
		'<div class="notice notice-warning is-dismissible"><p>%s</p></div>',
		wp_kses(
			sprintf(
				/* translators: 1: days remaining string, 2: upgrade URL */
				__( 'TesseNav: your premium grace period expires in %1$s. <a href="%2$s">Upgrade now</a> to keep all features.', 'tessenav' ),
				$days_str,
				$upgrade_url
			),
			array( 'a' => array( 'href' => array() ) )
		)
	);
}
add_action( 'admin_notices', 'sagiriswd_tessenav_grace_period_admin_notice' );

/**
 * Registers the REST route used by the editor to refetch license state on focus.
 *
 * The editor enqueues a stale snapshot of premium status at load time; when the
 * author activates a license in another tab and returns, this endpoint provides
 * the fresh value so the upsell card vanishes without a full editor reload.
 */
function sagiriswd_tessenav_register_license_status_route() {
	register_rest_route(
		'tessenav/v1',
		'/license-status',
		array(
			'methods'             => WP_REST_Server::READABLE,
			'callback'            => 'sagiriswd_tessenav_rest_license_status',
			'permission_callback' => function () {
				return current_user_can( 'edit_posts' );
			},
		)
	);
}
add_action( 'rest_api_init', 'sagiriswd_tessenav_register_license_status_route' );

/**
 * REST callback that returns the current premium status snapshot.
 *
 * @return WP_REST_Response
 */
function sagiriswd_tessenav_rest_license_status() {
	$status = sagiriswd_tessenav_premium_status();
	return rest_ensure_response(
		array(
			'isPremium'          => (bool) $status['isPremium'],
			'inGracePeriod'      => (bool) $status['inGracePeriod'],
			'graceDaysRemaining' => (int) $status['graceDaysRemaining'],
		)
	);
}

/**
 * Passes premium status and upgrade URL to the block editor.
 */
function sagiriswd_tessenav_enqueue_editor_settings() {
	$status = sagiriswd_tessenav_premium_status();
	wp_localize_script(
		'sagiriswd-tessenav-editor-script',
		'tessenavSettings',
		array(
			'isPremium'          => $status['isPremium'],
			'inGracePeriod'      => $status['inGracePeriod'],
			'graceDaysRemaining' => $status['graceDaysRemaining'],
			'upgradeUrl'         => TESSENAV_UPGRADE_URL,
			'checkoutUrls'       => sagiriswd_tessenav_checkout_urls(),
			'licensePageUrl'     => add_query_arg( 'ref', 'tessenav-editor-card', menu_page_url( 'tessenav-license', false ) ),
		)
	);

	// Toolbar fix for narrow preview viewports.
	//
	// In Tablet/Mobile preview the editor canvas is scaled to <600px, but the
	// floating block toolbar still anchors above the selected block — landing
	// on top of whatever sits above it (post title, sibling blocks, header
	// chrome). The fix is to switch the user's `fixedToolbar` preference on
	// while the canvas is narrow so the toolbar mounts in the editor top bar
	// instead, then restore the previous value when the viewport widens.
	wp_add_inline_script(
		'wp-edit-post',
		"( function() {
			if ( ! window.wp || ! wp.data ) return;
			var prefs = wp.data.dispatch( 'core/preferences' );
			var prefsSelect = wp.data.select( 'core/preferences' );
			if ( ! prefs || ! prefsSelect ) return;

			var savedFixedToolbar = null;
			var forcedFixed = false;
			var threshold = 600;

			function tnUpdate() {
				var iframe = document.querySelector( 'iframe[name=\"editor-canvas\"]' );
				if ( ! iframe ) return;
				var rect = iframe.getBoundingClientRect();
				var isNarrow = rect.width > 0 && rect.width < threshold;
				if ( isNarrow && ! forcedFixed ) {
					savedFixedToolbar = !! prefsSelect.get( 'core', 'fixedToolbar' );
					prefs.set( 'core', 'fixedToolbar', true );
					forcedFixed = true;
				} else if ( ! isNarrow && forcedFixed ) {
					prefs.set( 'core', 'fixedToolbar', savedFixedToolbar );
					forcedFixed = false;
				}
			}

			// Initial run + retries until the canvas iframe mounts.
			var attempts = 0;
			var initial = setInterval( function() {
				attempts++;
				if ( document.querySelector( 'iframe[name=\"editor-canvas\"]' ) || attempts > 40 ) {
					clearInterval( initial );
					tnUpdate();
				}
			}, 150 );

			window.addEventListener( 'resize', tnUpdate );
			// Catch preview-device switches (no resize event fires for those).
			setInterval( tnUpdate, 500 );
		} )();"
	);
}
add_action( 'enqueue_block_editor_assets', 'sagiriswd_tessenav_enqueue_editor_settings' );

/**
 * Registers the block using a `blocks-manifest.php` file, which improves the performance of block type registration.
 * Behind the scenes, it also registers all assets so they can be enqueued
 * through the block editor in the corresponding context.
 *
 * @see https://make.wordpress.org/core/2025/03/13/more-efficient-block-type-registration-in-6-8/
 * @see https://make.wordpress.org/core/2024/10/17/new-block-type-registration-apis-to-improve-performance-in-wordpress-6-7/
 */
function sagiriswd_tessenav_block_init() {
	/**
	 * Registers the block(s) metadata from the `blocks-manifest.php` and registers the block type(s)
	 * based on the registered block metadata.
	 * Added in WordPress 6.8 to simplify the block metadata registration process added in WordPress 6.7.
	 *
	 * @see https://make.wordpress.org/core/2025/03/13/more-efficient-block-type-registration-in-6-8/
	 */
	if ( function_exists( 'wp_register_block_types_from_metadata_collection' ) ) {
		wp_register_block_types_from_metadata_collection( __DIR__ . '/build', __DIR__ . '/build/blocks-manifest.php' );
		return;
	}

	/**
	 * Registers the block(s) metadata from the `blocks-manifest.php` file.
	 * Added to WordPress 6.7 to improve the performance of block type registration.
	 *
	 * @see https://make.wordpress.org/core/2024/10/17/new-block-type-registration-apis-to-improve-performance-in-wordpress-6-7/
	 */
	if ( function_exists( 'wp_register_block_metadata_collection' ) ) {
		wp_register_block_metadata_collection( __DIR__ . '/build', __DIR__ . '/build/blocks-manifest.php' );
	}
	/**
	 * Registers the block type(s) in the `blocks-manifest.php` file.
	 *
	 * @see https://developer.wordpress.org/reference/functions/register_block_type/
	 */
	$manifest_data = require __DIR__ . '/build/blocks-manifest.php';
	foreach ( array_keys( $manifest_data ) as $block_type ) {
		register_block_type( __DIR__ . "/build/{$block_type}" );
	}
}
add_action( 'init', 'sagiriswd_tessenav_block_init' );

// ─── Daily license validation cron ───────────────────────────────────────────

function sagiriswd_tessenav_maybe_schedule_cron() {
	if ( ! wp_next_scheduled( 'sagiriswd_tessenav_daily_validate' ) ) {
		wp_schedule_event( time(), 'daily', 'sagiriswd_tessenav_daily_validate' );
	}
}
add_action( 'init', 'sagiriswd_tessenav_maybe_schedule_cron' );

add_action( 'sagiriswd_tessenav_daily_validate', 'sagiriswd_tessenav_validate_license' );

// ─── Individual key + bundle notice ──────────────────────────────────────────

/**
 * Shows an admin notice when both a bundle key and an individual TesseNav key
 * are active. Reminds the user that the individual key is still being billed
 * and can be used on another domain.
 */
function sagiriswd_tessenav_individual_key_notice() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	if ( ! sagiriswd_tessenav_is_relevant_admin_screen() ) {
		return;
	}

	$bundle_status = get_option( 'sagiriswd_bundle_license_status', array( 'valid' => false ) );
	if ( empty( $bundle_status['valid'] ) ) {
		return;
	}

	if ( ! get_option( 'sagiriswd_tessenav_license_key' ) ) {
		return;
	}

	// menu_page_url() auto-resolves to whichever parent (Sagiris-menu submenu OR
	// Settings options-page) the license page is registered under, so this link
	// stays correct whether the bundle plugin is present or TesseNav is standalone.
	// Falls back to the conditional pattern if admin_menu hasn't fired yet.
	$manage_url = menu_page_url( 'tessenav-license', false );
	if ( ! $manage_url ) {
		$manage_url = sagiriswd_tessenav_sagiris_menu_exists()
			? admin_url( 'admin.php?page=tessenav-license' )
			: admin_url( 'options-general.php?page=tessenav-license' );
	}

	printf(
		'<div class="notice notice-info is-dismissible"><p>%s</p></div>',
		wp_kses(
			sprintf(
				/* translators: %s: URL to TesseNav license settings */
				__( '<strong>TesseNav:</strong> Your individual license key is active and still being billed separately from your bundle. You can use it on another domain. <a href="%s">Manage your individual license</a>.', 'tessenav' ),
				esc_url( $manage_url )
			),
			array(
				'strong' => array(),
				'a'      => array( 'href' => array() ),
			)
		)
	);
}
add_action( 'admin_notices', 'sagiriswd_tessenav_individual_key_notice' );

// ─── Navigator rendering helpers ─────────────────────────────────────────────
// Loaded here so PHPUnit tests can call them without having to include the
// block render template (which contains executable output code).

if ( ! function_exists( 'sagiriswd_tessenav_assign_screen_ids' ) ) {
	/**
	 * DFS traversal assigning sequential screen IDs to all sagiriswd/tessenav-submenu
	 * blocks.  Uses spl_object_id as a stable key per block instance.
	 *
	 * @param iterable $inner_blocks Blocks to traverse.
	 * @param int      $index        Running counter, passed by reference.
	 * @param array    $id_map       Map from spl_object_id to screen-N string.
	 */
	function sagiriswd_tessenav_assign_screen_ids( $inner_blocks, &$index, &$id_map ) {
		foreach ( $inner_blocks as $block ) {
			if ( 'sagiriswd/tessenav-submenu' === $block->name ) {
				$id_map[ spl_object_id( $block ) ] = 'screen-' . $index++;
				sagiriswd_tessenav_assign_screen_ids( $block->inner_blocks, $index, $id_map );
			}
		}
	}
}

if ( ! function_exists( 'sagiriswd_tessenav_build_navigator_submenu_screens' ) ) {
	/**
	 * Recursively builds the HTML for each sagiriswd/tessenav-submenu screen.
	 *
	 * @param iterable $inner_blocks Blocks to traverse.
	 * @param array    $id_map       Map from spl_object_id to screen-N string.
	 * @return string HTML string.
	 */
	function sagiriswd_tessenav_build_navigator_submenu_screens( $inner_blocks, $id_map ) {
		$chevron_right = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false"><path d="M4 1.5L8.5 6L4 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
		$chevron_left  = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M15 6L9 12L15 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
		$html          = '';

		foreach ( $inner_blocks as $block ) {
			if ( 'sagiriswd/tessenav-submenu' !== $block->name ) {
				continue;
			}

			$screen_id   = $id_map[ spl_object_id( $block ) ] ?? '';
			$label       = isset( $block->attributes['label'] ) ? wp_kses_post( $block->attributes['label'] ) : '';
			$back_button = sprintf(
				'<button class="sagiriswd-tn__navigator-back" data-wp-on--click="actions.navigateBack">%s%s</button>',
				$chevron_left,
				$label
			);

			// Nested submenus first, then other inner block content.
			$drill_downs  = '';
			$other_blocks = '';
			foreach ( $block->inner_blocks as $child ) {
				if ( 'sagiriswd/tessenav-submenu' === $child->name ) {
					$child_screen = $id_map[ spl_object_id( $child ) ] ?? '';
					$child_label  = isset( $child->attributes['label'] ) ? wp_kses_post( $child->attributes['label'] ) : '';
					$drill_downs .= sprintf(
						'<button class="sagiriswd-tn__navigator-drill-down" data-wp-on--click="actions.navigateTo" data-wp-context=\'{"screenId":"%s"}\'>%s%s</button>',
						esc_attr( $child_screen ),
						$child_label,
						$chevron_right
					);
				} else {
					$other_blocks .= $child->render();
				}
			}

			$html .= sprintf(
				'<div class="sagiriswd-tn__navigator-screen" data-wp-context=\'{"screenId":"%s"}\' data-wp-class--is-active="state.isCurrentScreen">%s%s%s</div>',
				esc_attr( $screen_id ),
				$back_button,
				$drill_downs,
				$other_blocks
			);

			$html .= sagiriswd_tessenav_build_navigator_submenu_screens( $block->inner_blocks, $id_map );
		}

		return $html;
	}
}

if ( ! function_exists( 'sagiriswd_tessenav_build_navigator_html' ) ) {
	/**
	 * Builds the full Navigator HTML: root screen + all submenu screens.
	 *
	 * Accepts $premium_status directly to allow unit testing without relying on
	 * sagiriswd_tessenav_premium_status().
	 *
	 * @param iterable $top_level_inner_blocks Direct inner blocks of the TesseNav block.
	 * @param array    $id_map                 Map from spl_object_id to screen-N string.
	 * @param array    $premium_status         { isPremium: bool, inGracePeriod: bool, graceDaysRemaining: int }
	 * @return string HTML string.
	 */
	function sagiriswd_tessenav_build_navigator_html( $top_level_inner_blocks, $id_map, $premium_status ) {
		$chevron_right         = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" focusable="false"><path d="M4 1.5L8.5 6L4 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
		$top_level_count       = 0;
		$root_content          = '';
		$allowed_submenu_roots = array();

		foreach ( $top_level_inner_blocks as $block ) {
			if ( 'sagiriswd/tessenav-submenu' === $block->name ) {
				$top_level_count++;
				if ( sagiriswd_tessenav_is_gated_top_level_submenu( $block->name, $top_level_count, $premium_status ) ) {
					continue;
				}
				$screen_id              = $id_map[ spl_object_id( $block ) ] ?? '';
				$label                  = isset( $block->attributes['label'] ) ? wp_kses_post( $block->attributes['label'] ) : '';
				$allowed_submenu_roots[] = $block;
				$root_content          .= sprintf(
					'<button class="sagiriswd-tn__navigator-drill-down" data-wp-on--click="actions.navigateTo" data-wp-context=\'{"screenId":"%s"}\'>%s%s</button>',
					esc_attr( $screen_id ),
					$label,
					$chevron_right
				);
			} else {
				$root_content .= $block->render();
			}
		}

		$root_screen     = sprintf(
			'<div class="sagiriswd-tn__navigator-screen sagiriswd-tn__navigator-screen--root" data-wp-context=\'{"screenId":"root"}\' data-wp-class--is-active="state.isCurrentScreen">%s</div>',
			$root_content
		);
		// Only build screens for allowed top-level submenus (free-tier limit respected).
		$submenu_screens = sagiriswd_tessenav_build_navigator_submenu_screens( $allowed_submenu_roots, $id_map );

		return sprintf(
			'<div class="sagiriswd-tn__navigator" data-wp-class--is-navigating-forward="state.isNavigatingForward" data-wp-class--is-navigating-back="state.isNavigatingBack">%s%s</div>',
			$root_screen,
			$submenu_screens
		);
	}
}
