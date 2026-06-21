<?php
/**
 * Individual TesseNav license key validation against the Lemon Squeezy license API.
 *
 * @package Sagiriswd
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'TESSENAV_LS_API_BASE', 'https://api.lemonsqueezy.com/v1/licenses/' );

/**
 * Activates an individual TesseNav license key. Stores the instance ID returned by
 * Lemon Squeezy and writes the initial cached status to wp_options.
 *
 * @param string $license_key The key entered by the user.
 * @return bool True on successful activation.
 */
function sagiriswd_tessenav_activate_license( $license_key ) {
	$response = wp_safe_remote_post(
		TESSENAV_LS_API_BASE . 'activate',
		array(
			'body' => array(
				'license_key'   => $license_key,
				'instance_name' => home_url(),
			),
		)
	);

	if ( is_wp_error( $response ) ) {
		return false;
	}

	$body = json_decode( wp_remote_retrieve_body( $response ), true );

	if ( empty( $body['activated'] ) ) {
		return false;
	}

	$expiry     = null;
	$expires_at = $body['license']['expires_at'] ?? null;
	if ( $expires_at ) {
		$expiry = strtotime( $expires_at );
	}

	$variant_id = isset( $body['meta']['variant_id'] ) ? (int) $body['meta']['variant_id'] : 0;
	$tier       = function_exists( 'sagiriswd_tessenav_tier_for_variant_id' )
		? sagiriswd_tessenav_tier_for_variant_id( $variant_id )
		: null;

	update_option( 'sagiriswd_tessenav_license_key', $license_key, false );
	update_option( 'sagiriswd_tessenav_license_instance_id', $body['instance']['id'], false );
	update_option(
		'sagiriswd_tessenav_license_status',
		array(
			'valid'      => true,
			'expiry'     => $expiry,
			'variant_id' => $variant_id ?: null,
			'tier'       => $tier,
		),
		false
	);

	return true;
}

/**
 * Validates the stored individual TesseNav license key against Lemon Squeezy.
 * Called by daily cron. If the server is unreachable, cached status is preserved.
 */
function sagiriswd_tessenav_validate_license() {
	$license_key = get_option( 'sagiriswd_tessenav_license_key' );
	$instance_id = get_option( 'sagiriswd_tessenav_license_instance_id' );

	if ( ! $license_key || ! $instance_id ) {
		return;
	}

	$response = wp_safe_remote_post(
		TESSENAV_LS_API_BASE . 'validate',
		array(
			'body' => array(
				'license_key' => $license_key,
				'instance_id' => $instance_id,
			),
		)
	);

	if ( is_wp_error( $response ) ) {
		return;
	}

	$body   = json_decode( wp_remote_retrieve_body( $response ), true );
	$valid  = ! empty( $body['valid'] );
	$expiry = null;

	$expires_at = $body['license']['expires_at'] ?? null;
	if ( $expires_at ) {
		$expiry = strtotime( $expires_at );
	}

	// Preserve tier from initial activation. The validate endpoint doesn't
	// always echo meta.variant_id back, so fall back to whatever was stored.
	$prev       = get_option( 'sagiriswd_tessenav_license_status', array() );
	$variant_id = isset( $body['meta']['variant_id'] )
		? (int) $body['meta']['variant_id']
		: ( $prev['variant_id'] ?? null );
	$tier       = function_exists( 'sagiriswd_tessenav_tier_for_variant_id' ) && $variant_id
		? sagiriswd_tessenav_tier_for_variant_id( $variant_id )
		: ( $prev['tier'] ?? null );

	update_option(
		'sagiriswd_tessenav_license_status',
		array(
			'valid'      => $valid,
			'expiry'     => $expiry,
			'variant_id' => $variant_id,
			'tier'       => $tier,
		),
		false
	);
}

/**
 * Deactivates the stored individual TesseNav license key on Lemon Squeezy and
 * removes all stored license data. No grace period — removal is immediate.
 */
function sagiriswd_tessenav_deactivate_license() {
	$license_key = get_option( 'sagiriswd_tessenav_license_key' );
	$instance_id = get_option( 'sagiriswd_tessenav_license_instance_id' );

	if ( $license_key && $instance_id ) {
		wp_safe_remote_post(
			TESSENAV_LS_API_BASE . 'deactivate',
			array(
				'body' => array(
					'license_key' => $license_key,
					'instance_id' => $instance_id,
				),
			)
		);
	}

	delete_option( 'sagiriswd_tessenav_license_key' );
	delete_option( 'sagiriswd_tessenav_license_instance_id' );
	delete_option( 'sagiriswd_tessenav_license_status' );
}
