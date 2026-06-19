<?php
/**
 * Tests for sagiriswd_tessenav_is_gated_top_level_submenu().
 *
 * This helper centralizes the free-tier "3 top-level submenus" cap used by both
 * the desktop and navigator render paths. NavigatorRendererTest covers the
 * call-site behavior; this file covers the helper's branches directly.
 */
class InnerBlocksHtmlGateTest extends WP_UnitTestCase {

	private function status( bool $is_premium, bool $in_grace ): array {
		return array(
			'isPremium'          => $is_premium,
			'inGracePeriod'      => $in_grace,
			'graceDaysRemaining' => $in_grace ? 15 : 0,
		);
	}

	public function test_gates_fourth_submenu_for_free_tier(): void {
		$status = $this->status( false, false );

		$this->assertFalse( sagiriswd_tessenav_is_gated_top_level_submenu( 'sagiriswd/tessenav-submenu', 1, $status ) );
		$this->assertFalse( sagiriswd_tessenav_is_gated_top_level_submenu( 'sagiriswd/tessenav-submenu', 2, $status ) );
		$this->assertFalse( sagiriswd_tessenav_is_gated_top_level_submenu( 'sagiriswd/tessenav-submenu', 3, $status ) );
		$this->assertTrue( sagiriswd_tessenav_is_gated_top_level_submenu( 'sagiriswd/tessenav-submenu', 4, $status ) );
		$this->assertTrue( sagiriswd_tessenav_is_gated_top_level_submenu( 'sagiriswd/tessenav-submenu', 5, $status ) );
	}

	public function test_never_gates_premium_users(): void {
		$status = $this->status( true, false );

		for ( $i = 1; $i <= 10; $i++ ) {
			$this->assertFalse(
				sagiriswd_tessenav_is_gated_top_level_submenu( 'sagiriswd/tessenav-submenu', $i, $status ),
				"Premium users must not be gated at position $i."
			);
		}
	}

	public function test_never_gates_grace_period_users(): void {
		$status = $this->status( false, true );

		for ( $i = 1; $i <= 10; $i++ ) {
			$this->assertFalse(
				sagiriswd_tessenav_is_gated_top_level_submenu( 'sagiriswd/tessenav-submenu', $i, $status ),
				"Grace-period users must not be gated at position $i."
			);
		}
	}

	public function test_never_gates_non_submenu_blocks(): void {
		$status = $this->status( false, false );

		$this->assertFalse( sagiriswd_tessenav_is_gated_top_level_submenu( 'core/paragraph', 99, $status ) );
		$this->assertFalse( sagiriswd_tessenav_is_gated_top_level_submenu( 'core/image', 99, $status ) );
	}
}
