<?php
/**
 * Tests for sagiriswd_tessenav_premium_status().
 *
 * Uses the sagiriswd_tessenav_is_premium_plugin_active filter to simulate
 * the presence/absence of sagiris-premium-blocks without manipulating constants.
 */
class PremiumStatusTest extends WP_UnitTestCase {

	public function tear_down(): void {
		remove_all_filters( 'sagiriswd_tessenav_is_premium_plugin_active' );
		delete_option( 'sagiriswd_premium_deactivated_at' );
		parent::tear_down();
	}

	public function test_premium_active(): void {
		add_filter( 'sagiriswd_tessenav_is_premium_plugin_active', '__return_true' );

		$status = sagiriswd_tessenav_premium_status();

		$this->assertTrue( $status['isPremium'] );
		$this->assertFalse( $status['inGracePeriod'] );
		$this->assertSame( 0, $status['graceDaysRemaining'] );
	}

	public function test_not_premium_no_timestamp(): void {
		add_filter( 'sagiriswd_tessenav_is_premium_plugin_active', '__return_false' );

		$status = sagiriswd_tessenav_premium_status();

		$this->assertFalse( $status['isPremium'] );
		$this->assertFalse( $status['inGracePeriod'] );
		$this->assertSame( 0, $status['graceDaysRemaining'] );
	}

	public function test_not_premium_within_grace_period(): void {
		add_filter( 'sagiriswd_tessenav_is_premium_plugin_active', '__return_false' );
		update_option( 'sagiriswd_premium_deactivated_at', time() - ( 5 * DAY_IN_SECONDS ) );

		$status = sagiriswd_tessenav_premium_status();

		$this->assertFalse( $status['isPremium'] );
		$this->assertTrue( $status['inGracePeriod'] );
		$this->assertGreaterThan( 0, $status['graceDaysRemaining'] );
		$this->assertLessThanOrEqual( TESSENAV_GRACE_PERIOD_DAYS, $status['graceDaysRemaining'] );
	}

	public function test_not_premium_grace_period_expired(): void {
		add_filter( 'sagiriswd_tessenav_is_premium_plugin_active', '__return_false' );
		update_option( 'sagiriswd_premium_deactivated_at', time() - ( 31 * DAY_IN_SECONDS ) );

		$status = sagiriswd_tessenav_premium_status();

		$this->assertFalse( $status['isPremium'] );
		$this->assertFalse( $status['inGracePeriod'] );
		$this->assertSame( 0, $status['graceDaysRemaining'] );
	}
}
