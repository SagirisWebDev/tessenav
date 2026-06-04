<?php
/**
 * Tests for sagiriswd_tessenav_grace_period_admin_notice().
 *
 * @package Sagiriswd
 */

/**
 * Tests the persistent admin notice shown during the premium grace period.
 */
class GracePeriodAdminNoticeTest extends WP_UnitTestCase {

	/**
	 * Sets up an admin user before each test so current_user_can('manage_options') passes.
	 */
	public function set_up(): void {
		parent::set_up();
		$admin = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin );
	}

	/**
	 * Cleans up filters, options, and current user after each test.
	 */
	public function tear_down(): void {
		remove_all_filters( 'sagiriswd_tessenav_is_premium_plugin_active' );
		delete_option( 'tessenav_premium_deactivated_at' );
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	/**
	 * Captures the output of the admin notice function.
	 */
	private function capture_notice(): string {
		ob_start();
		sagiriswd_tessenav_grace_period_admin_notice();
		return ob_get_clean();
	}

	/**
	 * Tests that no notice is shown when the premium plugin is active.
	 */
	public function test_no_notice_when_premium_active(): void {
		add_filter( 'sagiriswd_tessenav_is_premium_plugin_active', '__return_true' );

		$output = $this->capture_notice();

		$this->assertEmpty( $output );
	}

	/**
	 * Tests that no notice is shown on a fresh free install (no deactivation timestamp).
	 */
	public function test_no_notice_when_fresh_free_install(): void {
		add_filter( 'sagiriswd_tessenav_is_premium_plugin_active', '__return_false' );

		$output = $this->capture_notice();

		$this->assertEmpty( $output );
	}

	/**
	 * Tests that no notice is shown after the grace period has expired (31 days).
	 */
	public function test_no_notice_when_grace_period_expired(): void {
		add_filter( 'sagiriswd_tessenav_is_premium_plugin_active', '__return_false' );
		update_option( 'tessenav_premium_deactivated_at', time() - ( 31 * DAY_IN_SECONDS ) );

		$output = $this->capture_notice();

		$this->assertEmpty( $output );
	}

	/**
	 * Tests that no notice is shown at the exact grace period boundary (30 days elapsed).
	 */
	public function test_no_notice_at_exact_grace_period_boundary(): void {
		add_filter( 'sagiriswd_tessenav_is_premium_plugin_active', '__return_false' );
		update_option( 'tessenav_premium_deactivated_at', time() - ( TESSENAV_GRACE_PERIOD_DAYS * DAY_IN_SECONDS ) );

		$output = $this->capture_notice();

		$this->assertEmpty( $output );
	}

	/**
	 * Tests that the error-class notice is shown during the grace period.
	 */
	public function test_notice_shown_during_grace_period(): void {
		add_filter( 'sagiriswd_tessenav_is_premium_plugin_active', '__return_false' );
		update_option( 'tessenav_premium_deactivated_at', time() );

		$output = $this->capture_notice();

		$this->assertStringContainsString( 'notice-error', $output );
		$this->assertStringContainsString( 'grace period', $output );
		$this->assertStringContainsString( TESSENAV_UPGRADE_URL, $output );
	}

	/**
	 * Tests that the notice shows the correct number of days remaining.
	 */
	public function test_notice_shows_days_remaining(): void {
		add_filter( 'sagiriswd_tessenav_is_premium_plugin_active', '__return_false' );
		// 5 days elapsed leaves 25 days remaining (ceil(30 - 5) = 25).
		update_option( 'tessenav_premium_deactivated_at', time() - ( 5 * DAY_IN_SECONDS ) );

		$output = $this->capture_notice();

		$this->assertStringContainsString( '25', $output );
	}

	/**
	 * Tests that the notice uses singular "day" when exactly 1 day remains.
	 */
	public function test_notice_singular_day(): void {
		add_filter( 'sagiriswd_tessenav_is_premium_plugin_active', '__return_false' );
		// 29 days elapsed leaves 1 day remaining (ceil(30 - 29) = 1).
		update_option( 'tessenav_premium_deactivated_at', time() - ( 29 * DAY_IN_SECONDS ) );

		$output = $this->capture_notice();

		$this->assertStringContainsString( '1 day', $output );
		$this->assertStringNotContainsString( '1 days', $output );
	}

	/**
	 * Tests that the notice is not dismissible.
	 */
	public function test_notice_is_not_dismissible(): void {
		add_filter( 'sagiriswd_tessenav_is_premium_plugin_active', '__return_false' );
		update_option( 'tessenav_premium_deactivated_at', time() );

		$output = $this->capture_notice();

		$this->assertStringNotContainsString( 'is-dismissible', $output );
	}

	/**
	 * Tests that non-admin users do not see the notice.
	 */
	public function test_no_notice_for_non_admin_user(): void {
		add_filter( 'sagiriswd_tessenav_is_premium_plugin_active', '__return_false' );
		update_option( 'tessenav_premium_deactivated_at', time() );

		$subscriber = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $subscriber );

		$output = $this->capture_notice();

		$this->assertEmpty( $output );
	}
}
