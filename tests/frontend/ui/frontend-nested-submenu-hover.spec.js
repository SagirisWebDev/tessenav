// @ts-check
/**
 * Playwright browser tests — Frontend desktop inline view: nested submenu
 * hover-bridge (issue #13 red phase).
 *
 * Tests the acceptance criteria for the pseudo-element hover-bridge fix that
 * must be applied to `.sagiriswd-tn-submenu.has-child::after` in
 * `src/tessenav/style.scss`. The bridge is an invisible `::after` extension
 * from the wrapper's right edge to the parent dropdown's right edge so that
 * CSS `:hover` survives the cursor traversal from the nested wrapper toward
 * the flyout.
 *
 * --- Why hover mode must be restored via evaluate() ---
 *
 * The fixture page `/484-2/` renders its TesseNav block with
 * `openSubmenusOnClick: true`, so the server-side PHP adds `open-on-click`
 * to every `.sagiriswd-tn-submenu` wrapper. The CSS hover rule that is BROKEN
 * (and that the hover-bridge fix targets) is:
 *
 *   .sagiriswd-tn .has-child:not(.open-on-click):hover > .sagiriswd-tn__submenu-container
 *
 * This rule only fires when `open-on-click` is ABSENT. To exercise the hover
 * path in a real browser without changing the WordPress block settings, each
 * desktop test removes `open-on-click` from the relevant wrappers via
 * `page.evaluate()` immediately after load. This is a valid test technique
 * for the CSS hover path — it mirrors exactly the DOM state that would exist
 * when a site owner configures the block with hover-open behaviour.
 *
 * --- Fixture: http://localhost:10043/484-2/ ---
 *
 * Structure inside .sagiriswd-tn__container (desktop inline view):
 *   Products (.sagiriswd-tn-submenu.has-child)
 *     └─ Web Apps (.sagiriswd-tn-submenu.has-child)   ← level-2 nested
 *          └─ .sagiriswd-tn__submenu-container       ← the flyout under test
 *
 * Mobile Navigator structure (inside .sagiriswd-tn__navigator-wrapper):
 *   Root screen → Products drill-down button
 *   screen-0    → Web Apps drill-down button + back button
 *   screen-1    → Configs drill-down button + back button
 *
 * --- AC mapping ---
 *
 *   T1 AC-HOVER-OPENS    — At 1280×900, hovering Products then Web Apps opens
 *                          the flyout (visibility:visible, width > 0). Verifies
 *                          the CSS hover rule fires for the nested wrapper —
 *                          a precondition for the bridge to be relevant at all.
 *                          The cursor-traversal-of-gap assertion lives in T2.
 *
 *   T2 AC-BRIDGE-ZONE    — After T1 setup, dispatching a mousemove at the
 *                          geometric midpoint between Web Apps wrapper's right
 *                          edge and the flyout's left edge keeps the flyout
 *                          visible for 200 ms. Pre-implementation: wrapper has
 *                          no ::after extension so the midpoint is outside any
 *                          hover target → flyout closes. TEST FAILS (red).
 *
 *   T3 AC-MOBILE-DRILL   — At 600×900, the mobile navigator drills Products →
 *                          Web Apps via click; the Web Apps screen becomes
 *                          active. This path uses the navigator, not CSS hover,
 *                          so it must pass BEFORE and AFTER the fix.
 *                          This test is a regression guard: it must PASS in red
 *                          phase and must continue to pass after the fix.
 *
 * Style: mirrors editor-nested-submenu-positioning.spec.js and
 * nested-submenu-positioning.spec.js (selectors, helpers, EDGE_FUZZ pattern).
 */

import { test, expect } from '@playwright/test';

const FRONTEND_URL     = '/484-2/';
const DESKTOP_VIEWPORT = { width: 1280, height: 900 };
// Must be STRICTLY less than 600px — the hamburger button and navigator are
// hidden at min-width:600px (the compiled CSS breakpoint).
const MOBILE_VIEWPORT  = { width: 599,  height: 900 };
const TIMEOUT          = 10_000;
const BRIDGE_DWELL_MS  = 200; // how long to wait at the midpoint before asserting

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Navigate to the frontend fixture page at the given viewport and wait for the
 * TesseNav root nav to be attached.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ width: number, height: number }} viewport
 */
async function gotoFixture( page, viewport ) {
	await page.setViewportSize( viewport );
	await page.goto( FRONTEND_URL, { waitUntil: 'domcontentloaded' } );
	// Wait for the nav root to be in the DOM.
	await page
		.locator( 'nav.sagiriswd-tn' )
		.first()
		.waitFor( { state: 'attached', timeout: TIMEOUT } );
}

/**
 * Switch the TesseNav desktop inline view from open-on-click mode to CSS hover
 * mode by removing the `open-on-click` class from the Products and Web Apps
 * wrappers inside .sagiriswd-tn__container.
 *
 * This is required because the fixture block is configured with
 * `openSubmenusOnClick:true`, but the hover-bridge bug and fix target the CSS
 * `:hover` rule that only fires when `open-on-click` is absent.
 *
 * The function returns the bounding-box data needed by T2 so that we can
 * calculate the bridge midpoint before hovering destroys the layout state.
 *
 * @param {import('@playwright/test').Page} page
 */
async function enableHoverMode( page ) {
	await page.evaluate( () => {
		// Target only the DESKTOP inline container (.sagiriswd-tn__container), not
		// the mobile navigator. The container is the first direct child of nav.sagiriswd-tn
		// that carries sagiriswd-tn__container.
		const container = document.querySelector(
			'nav.sagiriswd-tn .sagiriswd-tn__container'
		);
		if ( ! container ) {
			return;
		}
		container.querySelectorAll( '.sagiriswd-tn-submenu.open-on-click' ).forEach(
			( el ) => {
				el.classList.remove( 'open-on-click' );
			}
		);
	} );
}

/**
 * Read the computed visibility and width of the Web Apps
 * `.sagiriswd-tn__submenu-container` from inside the page.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<{ visibility: string, width: number }>}
 */
async function readWebAppsContainerState( page ) {
	return page.evaluate( () => {
		const container = document.querySelector(
			'nav.sagiriswd-tn .sagiriswd-tn__container ' +
			'.sagiriswd-tn-submenu.has-child .sagiriswd-tn__submenu-container ' +
			'.sagiriswd-tn-submenu.has-child > .sagiriswd-tn__submenu-container'
		);
		if ( ! container ) {
			return { visibility: 'element-not-found', width: 0 };
		}
		const cs = window.getComputedStyle( container );
		return {
			visibility: cs.visibility,
			width: container.offsetWidth,
		};
	} );
}

// ─── T1: AC-HOVER-OPENS ───────────────────────────────────────────────────────

test.describe( 'T1 AC-HOVER-OPENS — nested flyout opens on hover handoff', () => {

	test( 'T1 — hover Products then Web Apps; Web Apps container is visibility:visible and width > 0', async ( { page } ) => {
		await gotoFixture( page, DESKTOP_VIEWPORT );
		await enableHoverMode( page );

		// Locate the desktop inline container (not the mobile navigator).
		const container = page.locator( 'nav.sagiriswd-tn .sagiriswd-tn__container' ).first();
		await container.waitFor( { state: 'visible', timeout: TIMEOUT } );

		// Locate Products wrapper inside the desktop inline container.
		const productsWrapper = container
			.locator( '.sagiriswd-tn-submenu.has-child' )
			.filter( { hasText: 'Products' } )
			.first();

		const productsCount = await productsWrapper.count();
		if ( productsCount === 0 ) {
			test.skip(
				true,
				'Fixture gap: no .sagiriswd-tn-submenu.has-child with text "Products" ' +
				'found inside .sagiriswd-tn__container on /484-2/.'
			);
			return;
		}

		// Hover Products — its CSS :hover rule opens Products' dropdown.
		// The label is inside an <a class="sagiriswd-tn-item__content"> child,
		// not a <button>; constrain on the anchor or drop the intermediate.
		await page.hover( 'nav.sagiriswd-tn .sagiriswd-tn__container .sagiriswd-tn-submenu.has-child:has(> a .sagiriswd-tn-item__label:text("Products"))' );
		// Allow the CSS transition to settle.
		await page.waitForTimeout( 150 );

		// Locate Web Apps inside Products' dropdown.
		const productsDropdown = productsWrapper.locator(
			':scope > .sagiriswd-tn__submenu-container'
		);

		const webAppsWrapper = productsDropdown
			.locator( '.sagiriswd-tn-submenu.has-child' )
			.filter( { hasText: 'Web Apps' } )
			.first();

		const webAppsCount = await webAppsWrapper.count();
		if ( webAppsCount === 0 ) {
			test.skip(
				true,
				'Fixture gap: no .sagiriswd-tn-submenu.has-child with text "Web Apps" ' +
				'found inside Products dropdown on /484-2/.'
			);
			return;
		}

		// Hover Web Apps wrapper — this establishes :hover and opens the flyout.
		await webAppsWrapper.hover();
		// Allow CSS transition to open the flyout.
		await page.waitForTimeout( 150 );

		// Cursor-traversal of the gap zone is the BRIDGE assertion — covered by
		// T2. T1's role is to verify the flyout opens at all on the hover handoff.
		// Keeping the cursor on the wrapper here keeps T1 robust regardless of
		// which side view.js places the flyout (issue #14 introduced left-side
		// placement, where Products' overflow:auto clips anything beyond its
		// box — including the bridge ::after, which is what T2 specifically
		// exercises with side-aware geometry).

		// Assert Web Apps' flyout is visible and has a real width.
		const state = await readWebAppsContainerState( page );

		expect(
			state.visibility,
			'Expected Web Apps .sagiriswd-tn__submenu-container to be ' +
			'visibility:visible after hovering Products then Web Apps. The CSS hover ' +
			'rule `.has-child:not(.open-on-click):hover > .submenu-container` should ' +
			'fire on the hover handoff (no bridge needed while the cursor is on the ' +
			'wrapper itself). If this fails, the rule\'s preconditions are not being ' +
			'met — most likely .has-child or .open-on-click classes have shifted.'
		).toBe( 'visible' );

		expect(
			state.width,
			'Expected Web Apps .sagiriswd-tn__submenu-container to have width > 0 ' +
			'once the hover state has opened it.'
		).toBeGreaterThan( 0 );
	} );

} );

// ─── T2: AC-BRIDGE-ZONE ───────────────────────────────────────────────────────

test.describe( 'T2 AC-BRIDGE-ZONE — cursor in the bridge gap keeps the flyout open', () => {

	test( 'T2 — mousemove at midpoint between Web Apps wrapper right-edge and flyout left-edge; flyout stays visible', async ( { page } ) => {
		await gotoFixture( page, DESKTOP_VIEWPORT );
		await enableHoverMode( page );

		const container = page.locator( 'nav.sagiriswd-tn .sagiriswd-tn__container' ).first();
		await container.waitFor( { state: 'visible', timeout: TIMEOUT } );

		// Hover Products to open its dropdown.
		await page.hover(
			'nav.sagiriswd-tn .sagiriswd-tn__container ' +
			'.sagiriswd-tn-submenu.has-child:has(> a .sagiriswd-tn-item__label:text("Products"))'
		);
		await page.waitForTimeout( 150 );

		// Locate the Products dropdown and Web Apps wrapper.
		const productsWrapper = container
			.locator( '.sagiriswd-tn-submenu.has-child' )
			.filter( { hasText: 'Products' } )
			.first();
		const productsDropdown = productsWrapper.locator(
			':scope > .sagiriswd-tn__submenu-container'
		);

		const webAppsWrapper = productsDropdown
			.locator( '.sagiriswd-tn-submenu.has-child' )
			.filter( { hasText: 'Web Apps' } )
			.first();

		const webAppsCount = await webAppsWrapper.count();
		if ( webAppsCount === 0 ) {
			test.skip(
				true,
				'Fixture gap: "Web Apps" .sagiriswd-tn-submenu.has-child not found inside ' +
				'Products dropdown on /484-2/. T2 requires the nested item to be present.'
			);
			return;
		}

		// Hover Web Apps to open its flyout.
		await webAppsWrapper.hover();
		await page.waitForTimeout( 150 );

		// Measure the gap zone between the Web Apps wrapper and its flyout. view.js
		// may place the flyout on either side (data-tn-side) depending on viewport
		// fit; the gap midpoint is computed accordingly. The bridge must cover this
		// gap in whichever direction the flyout was placed.
		const gapInfo = await page.evaluate( () => {
			// Web Apps wrapper — the narrow label-width div.
			const wrapper = document.querySelector(
				'nav.sagiriswd-tn .sagiriswd-tn__container ' +
				'.sagiriswd-tn-submenu.has-child .sagiriswd-tn__submenu-container ' +
				'.sagiriswd-tn-submenu.has-child'
			);
			if ( ! wrapper ) {
				return null;
			}
			// Web Apps flyout container.
			const flyout = wrapper.querySelector(
				':scope > .sagiriswd-tn__submenu-container'
			);
			if ( ! flyout ) {
				return null;
			}
			const wBox = wrapper.getBoundingClientRect();
			const fBox = flyout.getBoundingClientRect();
			const side = flyout.dataset.tnSide || 'right';
			const gapMidX = side === 'left'
				? ( wBox.left + fBox.right ) / 2
				: ( wBox.right + fBox.left ) / 2;
			const gapWidth = side === 'left'
				? wBox.left - fBox.right
				: fBox.left - wBox.right;
			return {
				side,
				wrapperMidY: wBox.top + wBox.height / 2,
				gapMidX,
				gapWidth,
			};
		} );

		if ( ! gapInfo ) {
			test.skip(
				true,
				'Fixture gap: could not measure Web Apps wrapper or flyout bounding boxes. ' +
				'Ensure the fixture has Products → Web Apps → .sagiriswd-tn__submenu-container.'
			);
			return;
		}

		// If the flyout left-edge is already at or left of the wrapper right-edge there
		// is no gap to bridge. Log a note but still assert visibility — if there IS a
		// gap the test will fail as expected.
		if ( gapInfo.gapWidth <= 0 ) {
			// No physical gap visible in this measurement. The bridge test is still
			// meaningful: the flyout may still lose :hover as the cursor moves into
			// what appeared to be a zero-gap zone due to sub-pixel positioning.
			// The test asserts that visibility is maintained after the mouse move.
		}

		// Dispatch mousemove at the geometric midpoint of the gap zone.
		// Pre-implementation: this point is not inside any hover target → the wrapper
		// loses :hover → flyout closes within the CSS transition time.
		await page.mouse.move( gapInfo.gapMidX, gapInfo.wrapperMidY );

		// Wait to let the CSS hover state react.
		await page.waitForTimeout( BRIDGE_DWELL_MS );

		// Assert the flyout is still visible.
		const stateAfter = await readWebAppsContainerState( page );

		expect(
			stateAfter.visibility,
			`Expected Web Apps flyout to STILL be visibility:visible after the cursor ` +
			`moved to the midpoint of the gap zone ` +
			`(side=${ gapInfo.side }, gapMidX=${ gapInfo.gapMidX.toFixed( 1 ) }px, ` +
			`gapWidth=${ gapInfo.gapWidth.toFixed( 1 ) }px). ` +
			`Pre-implementation: the wrapper has no ::after bridge extension; the cursor ` +
			`lands in empty space, :hover drops, flyout closes. ` +
			`This test FAILS in red phase (expected: "visible", actual: "hidden").`
		).toBe( 'visible' );

		expect(
			stateAfter.width,
			'Expected flyout width to remain > 0 during cursor traverse of the gap zone. ' +
			'Pre-implementation: flyout collapses to width:0 (or 0px from CSS) once :hover drops.'
		).toBeGreaterThan( 0 );
	} );

} );

// ─── T3: AC-MOBILE-DRILL ─────────────────────────────────────────────────────

test.describe( 'T3 AC-MOBILE-DRILL — mobile navigator drill-down regression guard', () => {

	test( 'T3 — at 600×900, click overlay open → drill Products → drill Web Apps; Web Apps screen is active', async ( { page } ) => {
		await gotoFixture( page, MOBILE_VIEWPORT );

		// --- Step 1: Open the mobile overlay by clicking the hamburger ---
		const hamburger = page.locator( '.sagiriswd-tn__responsive-container-open' ).first();
		await hamburger.waitFor( { state: 'visible', timeout: TIMEOUT } );
		await hamburger.click();

		// The overlay container must get is-menu-open once the overlay opens.
		const overlay = page.locator( '.sagiriswd-tn__responsive-container' ).first();
		await expect( overlay ).toHaveClass( /is-menu-open/, { timeout: TIMEOUT } );

		// --- Step 2: Verify the navigator is present ---
		const navigatorWrapper = page.locator( '.sagiriswd-tn__navigator-wrapper' ).first();
		await navigatorWrapper.waitFor( { state: 'visible', timeout: TIMEOUT } );

		// The root navigator screen must be active.
		const rootScreen = page.locator(
			'.sagiriswd-tn__navigator-screen--root'
		).first();
		await expect( rootScreen ).toHaveClass( /is-active/, { timeout: TIMEOUT } );

		// --- Step 3: Drill into Products ---
		// The navigator renders drill-down buttons (.sagiriswd-tn__navigator-drill-down)
		// with the submenu label as text. Clicking navigates forward to that screen.
		const productsDrill = page
			.locator( '.sagiriswd-tn__navigator-drill-down' )
			.filter( { hasText: /^Products/ } )
			.first();

		const productsDrillCount = await productsDrill.count();
		if ( productsDrillCount === 0 ) {
			test.skip(
				true,
				'Fixture gap: no .sagiriswd-tn__navigator-drill-down with text "Products" ' +
				'found in the mobile navigator on /484-2/. ' +
				'T3 requires the Products submenu to render a drill-down button.'
			);
			return;
		}

		await productsDrill.click();

		// Allow navigator transition to complete.
		await page.waitForTimeout( 300 );

		// The root screen should no longer be active; a "Products" screen is now active.
		// The Products navigator screen has a back button labelled "Products".
		const productsBackButton = page
			.locator( '.sagiriswd-tn__navigator-back' )
			.filter( { hasText: /Products/ } )
			.first();

		await expect( productsBackButton ).toBeVisible( { timeout: TIMEOUT } );

		// --- Step 4: Drill into Web Apps from the Products screen ---
		const webAppsDrill = page
			.locator( '.sagiriswd-tn__navigator-drill-down' )
			.filter( { hasText: /^Web Apps/ } )
			.first();

		const webAppsDrillCount = await webAppsDrill.count();
		if ( webAppsDrillCount === 0 ) {
			test.skip(
				true,
				'Fixture gap: no .sagiriswd-tn__navigator-drill-down with text "Web Apps" ' +
				'found in the Products navigator screen on /484-2/. ' +
				'T3 requires Web Apps to have its own drill-down button inside Products.'
			);
			return;
		}

		await webAppsDrill.click();
		await page.waitForTimeout( 300 );

		// The Web Apps screen is now active. Its back button is labelled "Web Apps".
		const webAppsBackButton = page
			.locator( '.sagiriswd-tn__navigator-back' )
			.filter( { hasText: /Web Apps/ } )
			.first();

		await expect(
			webAppsBackButton,
			'Expected a .sagiriswd-tn__navigator-back button labelled "Web Apps" to be ' +
			'visible after drilling from Products into Web Apps. ' +
			'This back button confirms that Web Apps is the currently active navigator screen. ' +
			'This test must PASS in both red phase (before the fix) and green phase (after). ' +
			'If it fails, the mobile navigator regression guard has caught a breakage.'
		).toBeVisible( { timeout: TIMEOUT } );
	} );

} );
