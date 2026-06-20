<?php
/**
 * Tests for sagiriswd_tessenav_grace_period_admin_notice().
 *
 * Grace period is triggered by subscription lapse (expiry timestamp in the past),
 * not by plugin deactivation. State is driven through wp_options.
 *
 * @package Sagiriswd
 */
class GracePeriodAdminNoticeTest extends WP_UnitTestCase {

	public function set_up(): void {
		parent::set_up();
		$admin = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin );
		// Notices are scoped to relevant admin screens (Rule 11 compliance).
		// Tests pin the dashboard screen so they exercise the OTHER conditions
		// rather than the screen-scoping branch.
		set_current_screen( 'dashboard' );
	}

	public function tear_down(): void {
		delete_option( 'sagiriswd_bundle_license_status' );
		delete_option( 'sagiriswd_tessenav_license_status' );
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	private function capture_notice(): string {
		ob_start();
		sagiriswd_tessenav_grace_period_admin_notice();
		return ob_get_clean();
	}

	// ── No notice when premium is active ─────────────────────────────────────

	public function test_no_notice_when_bundle_key_valid(): void {
		update_option( 'sagiriswd_bundle_license_status', array( 'valid' => true, 'expiry' => null ) );

		$this->assertEmpty( $this->capture_notice() );
	}

	public function test_no_notice_when_individual_key_valid(): void {
		update_option( 'sagiriswd_tessenav_license_status', array( 'valid' => true, 'expiry' => time() + DAY_IN_SECONDS ) );

		$this->assertEmpty( $this->capture_notice() );
	}

	// ── No notice on a fresh free install (no options stored) ────────────────

	public function test_no_notice_when_fresh_free_install(): void {
		$this->assertEmpty( $this->capture_notice() );
	}

	// ── No notice after grace period has fully expired ────────────────────────

	public function test_no_notice_when_grace_period_expired(): void {
		update_option( 'sagiriswd_tessenav_license_status', array(
			'valid'  => false,
			'expiry' => time() - ( 31 * DAY_IN_SECONDS ),
		) );

		$this->assertEmpty( $this->capture_notice() );
	}

	// ── No notice at the exact 30-day grace period boundary ──────────────────

	public function test_no_notice_at_exact_grace_period_boundary(): void {
		update_option( 'sagiriswd_tessenav_license_status', array(
			'valid'  => false,
			'expiry' => time() - ( TESSENAV_GRACE_PERIOD_DAYS * DAY_IN_SECONDS ),
		) );

		$this->assertEmpty( $this->capture_notice() );
	}

	// ── No notice on manual key removal (no expiry stored) ───────────────────

	public function test_no_notice_when_key_manually_removed(): void {
		update_option( 'sagiriswd_tessenav_license_status', array(
			'valid'  => false,
			'expiry' => null,
		) );

		$this->assertEmpty( $this->capture_notice() );
	}

	// ── Notice shown during grace period ─────────────────────────────────────

	public function test_notice_shown_during_grace_period(): void {
		update_option( 'sagiriswd_tessenav_license_status', array(
			'valid'  => false,
			'expiry' => time() - HOUR_IN_SECONDS,
		) );

		$output = $this->capture_notice();

		$this->assertStringContainsString( 'notice-warning', $output );
		$this->assertStringContainsString( 'grace period', $output );
		$this->assertStringContainsString( TESSENAV_UPGRADE_URL, $output );
	}

	// ── Notice shows correct days remaining ──────────────────────────────────

	public function test_notice_shows_days_remaining(): void {
		// 5 days since expiry → ceil(30 - 5) = 25 days remaining.
		update_option( 'sagiriswd_tessenav_license_status', array(
			'valid'  => false,
			'expiry' => time() - ( 5 * DAY_IN_SECONDS ),
		) );

		$this->assertStringContainsString( '25', $this->capture_notice() );
	}

	// ── Notice uses singular "day" at 1 day remaining ────────────────────────

	public function test_notice_singular_day(): void {
		// 29 days since expiry → ceil(30 - 29) = 1 day remaining.
		update_option( 'sagiriswd_tessenav_license_status', array(
			'valid'  => false,
			'expiry' => time() - ( 29 * DAY_IN_SECONDS ),
		) );

		$output = $this->capture_notice();

		$this->assertStringContainsString( '1 day', $output );
		$this->assertStringNotContainsString( '1 days', $output );
	}

	// ── Notice is dismissible (Rule 11 compliance) ───────────────────────────

	public function test_notice_is_dismissible(): void {
		update_option( 'sagiriswd_tessenav_license_status', array(
			'valid'  => false,
			'expiry' => time() - HOUR_IN_SECONDS,
		) );

		$this->assertStringContainsString( 'is-dismissible', $this->capture_notice() );
	}

	// ── Non-admin users do not see the notice ────────────────────────────────

	public function test_no_notice_for_non_admin_user(): void {
		update_option( 'sagiriswd_tessenav_license_status', array(
			'valid'  => false,
			'expiry' => time(),
		) );

		$subscriber = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $subscriber );

		$this->assertEmpty( $this->capture_notice() );
	}

	// ── Grace period notice also triggers via bundle lapse ───────────────────

	public function test_notice_shown_during_bundle_grace_period(): void {
		update_option( 'sagiriswd_bundle_license_status', array(
			'valid'  => false,
			'expiry' => time() - ( 5 * DAY_IN_SECONDS ),
		) );

		$output = $this->capture_notice();

		$this->assertStringContainsString( 'notice-warning', $output );
		$this->assertStringContainsString( 'grace period', $output );
	}

	// ── Screen scoping (Rule 11) ─────────────────────────────────────────────

	public function test_notice_suppressed_on_unrelated_admin_screen(): void {
		update_option( 'sagiriswd_tessenav_license_status', array(
			'valid'  => false,
			'expiry' => time() - HOUR_IN_SECONDS,
		) );
		// Unrelated screen — notice must not fire even though grace is active.
		set_current_screen( 'edit-post' );

		$this->assertEmpty( $this->capture_notice() );
	}

	public function test_notice_fires_on_plugins_screen(): void {
		update_option( 'sagiriswd_tessenav_license_status', array(
			'valid'  => false,
			'expiry' => time() - HOUR_IN_SECONDS,
		) );
		set_current_screen( 'plugins' );

		$this->assertStringContainsString( 'grace period', $this->capture_notice() );
	}
}
