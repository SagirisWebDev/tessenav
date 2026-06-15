<?php
/**
 * Tests for sagiriswd_tessenav_individual_key_notice().
 *
 * The notice appears when a bundle license is active on the same site as an
 * individual TesseNav key, reminding the admin that the individual key is still
 * being billed and can be used on another domain.
 *
 * @package Sagiriswd
 */
class IndividualKeyNoticeTest extends WP_UnitTestCase {

	public function set_up(): void {
		parent::set_up();
		$admin = self::factory()->user->create( array( 'role' => 'administrator' ) );
		wp_set_current_user( $admin );
	}

	public function tear_down(): void {
		delete_option( 'sagiriswd_bundle_license_status' );
		delete_option( 'sagiriswd_tessenav_license_key' );
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	private function capture_notice(): string {
		ob_start();
		sagiriswd_tessenav_individual_key_notice();
		return ob_get_clean();
	}

	// ── Conditions that suppress the notice ───────────────────────────────────

	public function test_no_notice_when_bundle_not_active(): void {
		update_option( 'sagiriswd_bundle_license_status', array( 'valid' => false, 'expiry' => null ) );
		update_option( 'sagiriswd_tessenav_license_key', 'XXXX-XXXX-XXXX-XXXX' );

		$this->assertEmpty( $this->capture_notice() );
	}

	public function test_no_notice_when_bundle_status_absent(): void {
		update_option( 'sagiriswd_tessenav_license_key', 'XXXX-XXXX-XXXX-XXXX' );

		$this->assertEmpty( $this->capture_notice() );
	}

	public function test_no_notice_when_no_individual_key_stored(): void {
		update_option( 'sagiriswd_bundle_license_status', array( 'valid' => true, 'expiry' => null ) );

		$this->assertEmpty( $this->capture_notice() );
	}

	public function test_no_notice_for_non_admin_user(): void {
		update_option( 'sagiriswd_bundle_license_status', array( 'valid' => true, 'expiry' => null ) );
		update_option( 'sagiriswd_tessenav_license_key', 'XXXX-XXXX-XXXX-XXXX' );

		$subscriber = self::factory()->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $subscriber );

		$this->assertEmpty( $this->capture_notice() );
	}

	// ── Notice is shown when both bundle and individual key are active ─────────

	public function test_notice_shown_when_bundle_and_individual_key_both_active(): void {
		update_option( 'sagiriswd_bundle_license_status', array( 'valid' => true, 'expiry' => null ) );
		update_option( 'sagiriswd_tessenav_license_key', 'XXXX-XXXX-XXXX-XXXX' );

		$this->assertNotEmpty( $this->capture_notice() );
	}

	// ── Notice content ────────────────────────────────────────────────────────

	public function test_notice_has_info_class(): void {
		update_option( 'sagiriswd_bundle_license_status', array( 'valid' => true, 'expiry' => null ) );
		update_option( 'sagiriswd_tessenav_license_key', 'XXXX-XXXX-XXXX-XXXX' );

		$this->assertStringContainsString( 'notice-info', $this->capture_notice() );
	}

	public function test_notice_is_not_dismissible(): void {
		update_option( 'sagiriswd_bundle_license_status', array( 'valid' => true, 'expiry' => null ) );
		update_option( 'sagiriswd_tessenav_license_key', 'XXXX-XXXX-XXXX-XXXX' );

		$this->assertStringNotContainsString( 'is-dismissible', $this->capture_notice() );
	}

	public function test_notice_mentions_billing(): void {
		update_option( 'sagiriswd_bundle_license_status', array( 'valid' => true, 'expiry' => null ) );
		update_option( 'sagiriswd_tessenav_license_key', 'XXXX-XXXX-XXXX-XXXX' );

		$this->assertStringContainsString( 'billed', $this->capture_notice() );
	}

	public function test_notice_mentions_other_domain(): void {
		update_option( 'sagiriswd_bundle_license_status', array( 'valid' => true, 'expiry' => null ) );
		update_option( 'sagiriswd_tessenav_license_key', 'XXXX-XXXX-XXXX-XXXX' );

		$this->assertStringContainsString( 'another domain', $this->capture_notice() );
	}

	public function test_notice_links_to_license_management_page(): void {
		update_option( 'sagiriswd_bundle_license_status', array( 'valid' => true, 'expiry' => null ) );
		update_option( 'sagiriswd_tessenav_license_key', 'XXXX-XXXX-XXXX-XXXX' );

		$this->assertStringContainsString( 'page=tessenav-license', $this->capture_notice() );
	}
}
