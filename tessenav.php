<?php
/**
 * Plugin Name:       TesseNav
 * Description:       Add text, media, layout, design and theme blocks to the Navigation block.
 * Version:           0.1.0
 * Requires at least: 6.7
 * Requires PHP:      7.4
 * Author:            Tiegan Benson
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       tessenav
 * Domain Path:       sagiriswd
 *
 * @package Sagiriswd
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

define( 'TESSENAV_GRACE_PERIOD_DAYS', 30 );
define( 'TESSENAV_UPGRADE_URL', 'https://example.com/upgrade' ); // Placeholder.

/**
 * Returns the current premium status for TesseNav.
 *
 * @return array{ isPremium: bool, inGracePeriod: bool, graceDaysRemaining: int }
 */
function sagiriswd_tessenav_premium_status() {
	$plugin_active = defined( 'SAGIRIS_PREMIUM_BLOCKS_VERSION' );
	// Filterable for testing without being able to undefine constants.
	$plugin_active = (bool) apply_filters( 'sagiriswd_tessenav_is_premium_plugin_active', $plugin_active );

	if ( $plugin_active ) {
		return array(
			'isPremium'          => true,
			'inGracePeriod'      => false,
			'graceDaysRemaining' => 0,
		);
	}

	$deactivated_at = get_option( 'tessenav_premium_deactivated_at' );

	if ( ! $deactivated_at ) {
		return array(
			'isPremium'          => false,
			'inGracePeriod'      => false,
			'graceDaysRemaining' => 0,
		);
	}

	$days_elapsed   = ( time() - (int) $deactivated_at ) / DAY_IN_SECONDS;
	$days_remaining = (int) ceil( TESSENAV_GRACE_PERIOD_DAYS - $days_elapsed );

	if ( $days_remaining > 0 ) {
		return array(
			'isPremium'          => false,
			'inGracePeriod'      => true,
			'graceDaysRemaining' => $days_remaining,
		);
	}

	return array(
		'isPremium'          => false,
		'inGracePeriod'      => false,
		'graceDaysRemaining' => 0,
	);
}

/**
 * Renders a persistent admin notice during the grace period after premium deactivation.
 */
function sagiriswd_tessenav_grace_period_admin_notice() {
	if ( ! current_user_can( 'manage_options' ) ) {
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
		'<div class="notice notice-error"><p>%s</p></div>',
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
 * Passes premium status and upgrade URL to the block editor.
 */
function sagiriswd_tessenav_enqueue_editor_settings() {
	$status = sagiriswd_tessenav_premium_status();
	wp_localize_script(
		'sagiriswd-tessenav-editor-script',
		'tessenavSettings',
		array(
			'isPremium'  => $status['isPremium'],
			'upgradeUrl' => TESSENAV_UPGRADE_URL,
		)
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
