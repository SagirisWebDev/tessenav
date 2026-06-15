<?php
/**
 * Tests for sagiriswd_tessenav_premium_status() and
 * sagiriswd_tessenav_resolve_grace_period().
 *
 * State is driven entirely through wp_options, matching the production code path.
 * No filters or constants are used.
 *
 * @package Sagiriswd
 */
class PremiumStatusTest extends WP_UnitTestCase {

	public function tear_down(): void {
		delete_option( 'sagiriswd_bundle_license_status' );
		delete_option( 'sagiriswd_tessenav_license_status' );
		parent::tear_down();
	}

	// ── Premium via bundle key ────────────────────────────────────────────────

	public function test_premium_via_valid_bundle_key(): void {
		update_option( 'sagiriswd_bundle_license_status', array( 'valid' => true, 'expiry' => null ) );

		$status = sagiriswd_tessenav_premium_status();

		$this->assertTrue( $status['isPremium'] );
		$this->assertFalse( $status['inGracePeriod'] );
		$this->assertSame( 0, $status['graceDaysRemaining'] );
	}

	// ── Premium via individual key ────────────────────────────────────────────

	public function test_premium_via_valid_individual_key(): void {
		update_option( 'sagiriswd_tessenav_license_status', array( 'valid' => true, 'expiry' => time() + DAY_IN_SECONDS ) );

		$status = sagiriswd_tessenav_premium_status();

		$this->assertTrue( $status['isPremium'] );
		$this->assertFalse( $status['inGracePeriod'] );
		$this->assertSame( 0, $status['graceDaysRemaining'] );
	}

	// ── Bundle priority ───────────────────────────────────────────────────────

	public function test_bundle_takes_priority_over_invalid_individual(): void {
		update_option( 'sagiriswd_bundle_license_status', array( 'valid' => true, 'expiry' => null ) );
		update_option( 'sagiriswd_tessenav_license_status', array( 'valid' => false, 'expiry' => null ) );

		$status = sagiriswd_tessenav_premium_status();

		$this->assertTrue( $status['isPremium'] );
		$this->assertFalse( $status['inGracePeriod'] );
	}

	// ── Free tier: no options stored ─────────────────────────────────────────

	public function test_free_tier_with_no_license_options(): void {
		$status = sagiriswd_tessenav_premium_status();

		$this->assertFalse( $status['isPremium'] );
		$this->assertFalse( $status['inGracePeriod'] );
		$this->assertSame( 0, $status['graceDaysRemaining'] );
	}

	// ── Grace period via bundle subscription lapse ────────────────────────────

	public function test_grace_period_via_bundle_subscription_lapse(): void {
		update_option( 'sagiriswd_bundle_license_status', array(
			'valid'  => false,
			'expiry' => time() - ( 5 * DAY_IN_SECONDS ),
		) );

		$status = sagiriswd_tessenav_premium_status();

		$this->assertFalse( $status['isPremium'] );
		$this->assertTrue( $status['inGracePeriod'] );
		$this->assertGreaterThan( 0, $status['graceDaysRemaining'] );
		$this->assertLessThanOrEqual( TESSENAV_GRACE_PERIOD_DAYS, $status['graceDaysRemaining'] );
	}

	// ── Grace period via individual key subscription lapse ────────────────────

	public function test_grace_period_via_individual_subscription_lapse(): void {
		update_option( 'sagiriswd_tessenav_license_status', array(
			'valid'  => false,
			'expiry' => time() - ( 5 * DAY_IN_SECONDS ),
		) );

		$status = sagiriswd_tessenav_premium_status();

		$this->assertFalse( $status['isPremium'] );
		$this->assertTrue( $status['inGracePeriod'] );
		$this->assertGreaterThan( 0, $status['graceDaysRemaining'] );
	}

	// ── Grace period expired ──────────────────────────────────────────────────

	public function test_free_tier_after_grace_period_expires(): void {
		update_option( 'sagiriswd_tessenav_license_status', array(
			'valid'  => false,
			'expiry' => time() - ( 31 * DAY_IN_SECONDS ),
		) );

		$status = sagiriswd_tessenav_premium_status();

		$this->assertFalse( $status['isPremium'] );
		$this->assertFalse( $status['inGracePeriod'] );
		$this->assertSame( 0, $status['graceDaysRemaining'] );
	}

	// ── Exact 30-day boundary: grace period not active ────────────────────────

	public function test_no_grace_period_at_exact_30_day_boundary(): void {
		update_option( 'sagiriswd_tessenav_license_status', array(
			'valid'  => false,
			'expiry' => time() - ( TESSENAV_GRACE_PERIOD_DAYS * DAY_IN_SECONDS ),
		) );

		$status = sagiriswd_tessenav_premium_status();

		$this->assertFalse( $status['inGracePeriod'] );
		$this->assertSame( 0, $status['graceDaysRemaining'] );
	}

	// ── No grace period on manual key removal ────────────────────────────────
	// Manual removal deletes the status option entirely. The default expiry is null,
	// so no grace period is granted.

	public function test_no_grace_period_when_key_manually_removed(): void {
		update_option( 'sagiriswd_tessenav_license_status', array(
			'valid'  => false,
			'expiry' => null,
		) );

		$status = sagiriswd_tessenav_premium_status();

		$this->assertFalse( $status['isPremium'] );
		$this->assertFalse( $status['inGracePeriod'] );
		$this->assertSame( 0, $status['graceDaysRemaining'] );
	}

	// ── Grace period uses the longest remaining days across both keys ─────────

	public function test_grace_period_uses_best_remaining_days(): void {
		// Bundle lapsed 5 days ago → 25 days remaining.
		update_option( 'sagiriswd_bundle_license_status', array(
			'valid'  => false,
			'expiry' => time() - ( 5 * DAY_IN_SECONDS ),
		) );
		// Individual lapsed 10 days ago → 20 days remaining.
		update_option( 'sagiriswd_tessenav_license_status', array(
			'valid'  => false,
			'expiry' => time() - ( 10 * DAY_IN_SECONDS ),
		) );

		$status = sagiriswd_tessenav_premium_status();

		$this->assertTrue( $status['inGracePeriod'] );
		$this->assertSame( 25, $status['graceDaysRemaining'] );
	}

	// ── No grace period when subscription has not yet lapsed ─────────────────
	// valid=false with a future expiry means LS returned invalid before the
	// subscription window closed — treat as free tier, not grace period.

	public function test_no_grace_period_when_expiry_is_in_future(): void {
		update_option( 'sagiriswd_tessenav_license_status', array(
			'valid'  => false,
			'expiry' => time() + ( 5 * DAY_IN_SECONDS ),
		) );

		$status = sagiriswd_tessenav_premium_status();

		$this->assertFalse( $status['inGracePeriod'] );
		$this->assertSame( 0, $status['graceDaysRemaining'] );
	}
}
