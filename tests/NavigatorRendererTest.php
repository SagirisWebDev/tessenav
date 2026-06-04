<?php
/**
 * Tests for sagiriswd_tessenav_build_navigator_html().
 *
 * Uses minimal WP_Block objects so status can be injected directly without
 * relying on sagiriswd_tessenav_premium_status().
 */
class NavigatorRendererTest extends WP_UnitTestCase {

	private function make_submenu_block_data( string $label, array $inner_blocks = [] ): array {
		return array(
			'blockName'    => 'sagiriswd/tessenav-submenu',
			'attrs'        => array( 'label' => $label ),
			'innerBlocks'  => $inner_blocks,
			'innerContent' => array(),
		);
	}

	/**
	 * Returns a WP_Block for sagiriswd/tessenav with $count top-level submenu children.
	 */
	private function make_nav_block( int $count ): WP_Block {
		$inner_blocks = array();
		for ( $i = 1; $i <= $count; $i++ ) {
			$inner_blocks[] = $this->make_submenu_block_data( "Menu $i" );
		}
		return new WP_Block(
			array(
				'blockName'    => 'sagiriswd/tessenav',
				'attrs'        => array(
					'overlayMenu'         => 'mobile',
					'hasIcon'             => true,
					'openSubmenusOnClick' => false,
					'showSubmenuIcon'     => false,
				),
				'innerBlocks'  => $inner_blocks,
				'innerContent' => array(),
			)
		);
	}

	/**
	 * Calls sagiriswd_tessenav_build_navigator_html() with the given status array injected directly.
	 */
	private function render_navigator( WP_Block $block, array $premium_status ): string {
		$index  = 0;
		$id_map = array();
		sagiriswd_tessenav_assign_screen_ids( $block->inner_blocks, $index, $id_map );
		return sagiriswd_tessenav_build_navigator_html( $block->inner_blocks, $id_map, $premium_status );
	}

	public function test_all_submenus_render_when_premium_active(): void {
		$block  = $this->make_nav_block( 5 );
		$status = array( 'isPremium' => true, 'inGracePeriod' => false, 'graceDaysRemaining' => 0 );
		$html   = $this->render_navigator( $block, $status );

		for ( $i = 1; $i <= 5; $i++ ) {
			$this->assertStringContainsString( "Menu $i", $html, "Menu $i should render when premium is active." );
		}
	}

	public function test_only_3_top_level_submenus_when_grace_period_expired(): void {
		$block  = $this->make_nav_block( 5 );
		$status = array( 'isPremium' => false, 'inGracePeriod' => false, 'graceDaysRemaining' => 0 );
		$html   = $this->render_navigator( $block, $status );

		for ( $i = 1; $i <= 3; $i++ ) {
			$this->assertStringContainsString( "Menu $i", $html, "Menu $i should render on free tier." );
		}
		$this->assertStringNotContainsString( 'Menu 4', $html, 'Menu 4 should be absent on free tier.' );
		$this->assertStringNotContainsString( 'Menu 5', $html, 'Menu 5 should be absent on free tier.' );
	}

	public function test_all_submenus_render_during_grace_period(): void {
		$block  = $this->make_nav_block( 5 );
		$status = array( 'isPremium' => false, 'inGracePeriod' => true, 'graceDaysRemaining' => 15 );
		$html   = $this->render_navigator( $block, $status );

		for ( $i = 1; $i <= 5; $i++ ) {
			$this->assertStringContainsString( "Menu $i", $html, "Menu $i should render during grace period." );
		}
	}
}
