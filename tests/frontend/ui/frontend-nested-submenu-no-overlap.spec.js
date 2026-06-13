// @ts-check
/**
 * Playwright browser tests — Frontend desktop inline view: nested submenu
 * no-overlap invariant (issue #14 red phase).
 *
 * Tests the acceptance criteria for the view.js side-selection fix: nested
 * submenus must never overlap their parent dropdown body. The current code
 * clamps the flyout leftward into the parent when neither side fits inside the
 * TesseNav block, causing a 259px overlap at the /484-2/ fixture
 * (1280×900 viewport, Products menuMaxWidth=600px, Web Apps width=300px).
 *
 * --- Why hover mode must be restored via evaluate() ---
 *
 * The fixture page `/484-2/` renders its TesseNav block with
 * `openSubmenusOnClick: true`, so the server-side PHP adds `open-on-click`
 * to every `.sagiriswd-tn-submenu` wrapper. The positioner runs on
 * `mouseover` / `focusin` / `click` but the CSS hover rule that keeps the
 * dropdown visible while the flyout is measured only fires when `open-on-click`
 * is ABSENT. To exercise the hover path, each desktop test removes
 * `open-on-click` from all wrappers inside `.sagiriswd-tn__container` via
 * `page.evaluate()` immediately after load.
 *
 * --- Fixture: http://localhost:10043/484-2/ ---
 *
 * Desktop inline structure:
 *   nav.sagiriswd-tn                                    x≈637.5..1282.5  (645px)
 *     .sagiriswd-tn__container
 *       Products (.sagiriswd-tn-submenu.has-child)
 *         .sagiriswd-tn__submenu-container             ← Products dropdown, x≈637.5..1239.5 (600px)
 *           Web Apps (.sagiriswd-tn-submenu.has-child)
 *             .sagiriswd-tn__submenu-container         ← Web Apps flyout, 300px wide
 *               Configs (.sagiriswd-tn-submenu)        ← leaf, no has-child
 *
 * Pre-fix: view.js writes `left: 342px` inline-style on Web Apps' container
 * after clamping 257px → Web Apps flyout renders at x≈980.5..1282.5, INSIDE
 * Products' dropdown (x≈637.5..1239.5) with ~259px overlap.
 *
 * --- AC mapping ---
 *
 *   T1 AC-NO-OVERLAP — At 1280×900, Web Apps flyout left ≥ Products right - 2
 *                      (right side) OR Web Apps flyout right ≤ Products left + 2
 *                      (left side). Pre-fix this FAILS: Web Apps left is ~980,
 *                      Products right is ~1239 — flyout is inside, not outside.
 *
 *   T2 AC-FITS-VIEWPORT — Same setup. Web Apps flyout right ≤ window.innerWidth + 2.
 *                          Pre-fix may pass or fail depending on clamp outcome; must
 *                          pass post-fix.
 *
 *   T3 AC-LEVEL3-NO-OVERLAP — Configs has no nested children in the fixture
 *                              (no `has-child` class), so this test.skip()s with a
 *                              clear fixture-gap message.
 *
 * Style: mirrors frontend-nested-submenu-hover.spec.js (selectors, helpers, EDGE_FUZZ).
 */

import { test, expect } from '@playwright/test';

const FRONTEND_URL     = '/484-2/';
const DESKTOP_VIEWPORT = { width: 1280, height: 900 };
// Sub-pixel tolerance: allow up to 2px overlap to avoid false positives from
// rounding, borders, or fractional pixel positions.
const EDGE_FUZZ = 2;
const TIMEOUT   = 10_000;

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
	await page
		.locator( 'nav.sagiriswd-tn' )
		.first()
		.waitFor( { state: 'attached', timeout: TIMEOUT } );
}

/**
 * Switch the TesseNav desktop inline view from open-on-click mode to CSS hover
 * mode by removing the `open-on-click` class from all wrappers inside
 * `.sagiriswd-tn__container`.
 *
 * Required because the fixture block is configured with `openSubmenusOnClick:
 * true`, but this test targets the hover path where positioning fires.
 *
 * @param {import('@playwright/test').Page} page
 */
async function enableHoverMode( page ) {
	await page.evaluate( () => {
		const container = document.querySelector(
			'nav.sagiriswd-tn .sagiriswd-tn__container'
		);
		if ( ! container ) {
			return;
		}
		container.querySelectorAll( '.sagiriswd-tn-submenu.open-on-click' ).forEach(
			( el ) => el.classList.remove( 'open-on-click' )
		);
	} );
}

/**
 * Hover Products, wait for its dropdown to open, then hover Web Apps and wait
 * for its flyout to be positioned by view.js.
 *
 * Returns the bounding boxes of the Products submenu-container and the Web Apps
 * submenu-container as measured AFTER positioning has run, so callers can assert
 * the overlap invariant.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<{ productsBox: DOMRect, webAppsBox: DOMRect, viewportWidth: number } | null>}
 */
async function openWebAppsFlyoutAndMeasure( page ) {
	// Hover Products to open its dropdown.
	// The label is inside an <a class="sagiriswd-tn-item__content"> child,
	// not a <button>; constrain on the anchor to match the rendered DOM.
	await page.hover(
		'nav.sagiriswd-tn .sagiriswd-tn__container ' +
		'.sagiriswd-tn-submenu.has-child:has(> a .sagiriswd-tn-item__label:text("Products"))'
	);
	await page.waitForTimeout( 150 );

	// Hover Web Apps to trigger the nested flyout + view.js positioner.
	const container = page.locator( 'nav.sagiriswd-tn .sagiriswd-tn__container' ).first();
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

	if ( ( await webAppsWrapper.count() ) === 0 ) {
		return null;
	}

	await webAppsWrapper.hover();
	// Allow CSS transition + requestAnimationFrame positioner to run.
	await page.waitForTimeout( 300 );

	// Measure bounding boxes from inside the browser so pixel values are
	// consistent with what view.js sees.
	return page.evaluate( () => {
		// Products submenu-container (the dropdown whose body must NOT be overlapped).
		const productsContainer = document.querySelector(
			'nav.sagiriswd-tn .sagiriswd-tn__container ' +
			'.sagiriswd-tn-submenu.has-child > .sagiriswd-tn__submenu-container'
		);
		// Web Apps submenu-container (the nested flyout that view.js positions).
		const webAppsContainer = document.querySelector(
			'nav.sagiriswd-tn .sagiriswd-tn__container ' +
			'.sagiriswd-tn-submenu.has-child .sagiriswd-tn__submenu-container ' +
			'.sagiriswd-tn-submenu.has-child > .sagiriswd-tn__submenu-container'
		);
		if ( ! productsContainer || ! webAppsContainer ) {
			return null;
		}
		const pBox = productsContainer.getBoundingClientRect();
		const wBox = webAppsContainer.getBoundingClientRect();
		return {
			productsBox: {
				left: pBox.left,
				right: pBox.right,
				top: pBox.top,
				bottom: pBox.bottom,
				width: pBox.width,
			},
			webAppsBox: {
				left: wBox.left,
				right: wBox.right,
				top: wBox.top,
				bottom: wBox.bottom,
				width: wBox.width,
			},
			viewportWidth: window.innerWidth,
		};
	} );
}

// ─── T1: AC-NO-OVERLAP ────────────────────────────────────────────────────────

test.describe( 'T1 AC-NO-OVERLAP — Web Apps flyout must not overlap Products dropdown body', () => {

	test(
		'T1 — viewport 1280×900: Web Apps flyout left ≥ Products right (right side) OR right ≤ Products left (left side)',
		async ( { page } ) => {
			await gotoFixture( page, DESKTOP_VIEWPORT );
			await enableHoverMode( page );

			const container = page.locator( 'nav.sagiriswd-tn .sagiriswd-tn__container' ).first();
			await container.waitFor( { state: 'visible', timeout: TIMEOUT } );

			// Guard: Products must exist.
			const productsWrapper = container
				.locator( '.sagiriswd-tn-submenu.has-child' )
				.filter( { hasText: 'Products' } )
				.first();
			if ( ( await productsWrapper.count() ) === 0 ) {
				test.skip(
					true,
					'Fixture gap: no .sagiriswd-tn-submenu.has-child with text "Products" ' +
					'found inside .sagiriswd-tn__container on /484-2/.'
				);
				return;
			}

			// Guard: Web Apps must exist inside Products.
			const productsDropdown = productsWrapper.locator(
				':scope > .sagiriswd-tn__submenu-container'
			);
			const webAppsWrapper = productsDropdown
				.locator( '.sagiriswd-tn-submenu.has-child' )
				.filter( { hasText: 'Web Apps' } )
				.first();
			if ( ( await webAppsWrapper.count() ) === 0 ) {
				test.skip(
					true,
					'Fixture gap: no .sagiriswd-tn-submenu.has-child with text "Web Apps" ' +
					'found inside Products dropdown on /484-2/.'
				);
				return;
			}

			const measured = await openWebAppsFlyoutAndMeasure( page );
			if ( ! measured ) {
				test.skip(
					true,
					'Fixture gap: could not measure Products or Web Apps bounding boxes — ' +
					'elements not found after hover.'
				);
				return;
			}

			const { productsBox, webAppsBox } = measured;

			// The no-overlap invariant: the flyout must be entirely outside the
			// parent dropdown on one side. Allow EDGE_FUZZ px to account for
			// borders, sub-pixel layout, and rounding in view.js (Math.round /
			// Math.ceil).
			//
			// Right-side placement: flyout left edge ≥ parent right edge - EDGE_FUZZ
			// Left-side placement:  flyout right edge ≤ parent left edge + EDGE_FUZZ
			const rightSideOk = webAppsBox.left >= productsBox.right - EDGE_FUZZ;
			const leftSideOk  = webAppsBox.right <= productsBox.left + EDGE_FUZZ;
			const noOverlap   = rightSideOk || leftSideOk;

			expect(
				noOverlap,
				`AC-NO-OVERLAP FAILED.\n` +
				`  Products dropdown:  left=${ productsBox.left.toFixed( 1 ) } right=${ productsBox.right.toFixed( 1 ) }\n` +
				`  Web Apps flyout:    left=${ webAppsBox.left.toFixed( 1 ) } right=${ webAppsBox.right.toFixed( 1 ) }\n` +
				`  Right-side check (flyout.left >= products.right - ${ EDGE_FUZZ }): ` +
				`${ webAppsBox.left.toFixed( 1 ) } >= ${ ( productsBox.right - EDGE_FUZZ ).toFixed( 1 ) } → ${ rightSideOk }\n` +
				`  Left-side check  (flyout.right <= products.left + ${ EDGE_FUZZ }): ` +
				`${ webAppsBox.right.toFixed( 1 ) } <= ${ ( productsBox.left + EDGE_FUZZ ).toFixed( 1 ) } → ${ leftSideOk }\n` +
				`  Pre-fix: view.js clamps the flyout leftward into the parent body. ` +
				`Web Apps container overlaps Products by ` +
				`${ ( productsBox.right - webAppsBox.left ).toFixed( 1 ) }px. ` +
				`This test FAILS in red phase (expected no-overlap, actual: overlap).`
			).toBe( true );
		}
	);

} );

// ─── T2: AC-FITS-VIEWPORT ─────────────────────────────────────────────────────

test.describe( 'T2 AC-FITS-VIEWPORT — Web Apps flyout stays within the viewport', () => {

	test(
		'T2 — viewport 1280×900: Web Apps flyout right edge ≤ window.innerWidth + 2',
		async ( { page } ) => {
			await gotoFixture( page, DESKTOP_VIEWPORT );
			await enableHoverMode( page );

			const container = page.locator( 'nav.sagiriswd-tn .sagiriswd-tn__container' ).first();
			await container.waitFor( { state: 'visible', timeout: TIMEOUT } );

			// Guard: Products must exist.
			const productsWrapper = container
				.locator( '.sagiriswd-tn-submenu.has-child' )
				.filter( { hasText: 'Products' } )
				.first();
			if ( ( await productsWrapper.count() ) === 0 ) {
				test.skip( true, 'Fixture gap: "Products" not found — see T1 for details.' );
				return;
			}

			// Guard: Web Apps must exist inside Products.
			const productsDropdown = productsWrapper.locator(
				':scope > .sagiriswd-tn__submenu-container'
			);
			const webAppsWrapper = productsDropdown
				.locator( '.sagiriswd-tn-submenu.has-child' )
				.filter( { hasText: 'Web Apps' } )
				.first();
			if ( ( await webAppsWrapper.count() ) === 0 ) {
				test.skip( true, 'Fixture gap: "Web Apps" not found inside Products — see T1 for details.' );
				return;
			}

			const measured = await openWebAppsFlyoutAndMeasure( page );
			if ( ! measured ) {
				test.skip( true, 'Fixture gap: bounding boxes unavailable — see T1 for details.' );
				return;
			}

			const { webAppsBox, viewportWidth } = measured;

			// Hard invariant: flyout must not extend past the right edge of the viewport
			// (allow EDGE_FUZZ px tolerance for sub-pixel rounding).
			expect(
				webAppsBox.right,
				`AC-FITS-VIEWPORT FAILED.\n` +
				`  Web Apps flyout right: ${ webAppsBox.right.toFixed( 1 ) }px\n` +
				`  window.innerWidth:     ${ viewportWidth }px\n` +
				`  Allowed maximum:       ${ viewportWidth + EDGE_FUZZ }px\n` +
				`  Pre-fix: view.js clamps the flyout to rootBox.right (≈1282.5px) via its ` +
				`block-fit clamp, so the flyout right edge is ≈1282.5px ≤ 1282px (viewport). ` +
				`T2 may therefore PASS pre-fix as a side-effect of the clamp. ` +
				`Post-fix the flyout must still stay within the viewport, even if it now ` +
				`extends past the inline TesseNav block's right edge.`
			).toBeLessThanOrEqual( viewportWidth + EDGE_FUZZ );
		}
	);

} );

// ─── T3: AC-LEVEL3-NO-OVERLAP ────────────────────────────────────────────────

test.describe( 'T3 AC-LEVEL3-NO-OVERLAP — level-3 alternation and no-overlap', () => {

	test(
		'T3 — Configs is a leaf in the fixture; no level-3 flyout to assert (fixture gap)',
		async ( { page } ) => {
			// The /484-2/ fixture structure confirmed via live DOM inspection:
			//
			//   Products (.has-child)
			//     Web Apps (.has-child)
			//       Configs (NO .has-child — leaf item)
			//
			// Configs does not have a nested submenu-container, so there is no
			// level-3 flyout for view.js to position and no no-overlap assertion
			// to make. If the fixture is updated to add a nested submenu under
			// Configs, this test.skip() should be removed and the assertion body
			// below (currently commented out) should be filled in and enabled.
			test.skip(
				true,
				'Fixture gap: "Configs" inside Web Apps has no nested children ' +
				'(.sagiriswd-tn-submenu.has-child) in /484-2/. ' +
				'Level-3 no-overlap cannot be asserted until the fixture gains a ' +
				'submenu item under Configs. ' +
				'T3 is intentionally skipped in red phase — not a test failure.'
			);

			// --- Stub for when the fixture is extended ---
			// If Configs gains a submenu, replace the test.skip() above with:
			//
			//   await gotoFixture( page, DESKTOP_VIEWPORT );
			//   await enableHoverMode( page );
			//   // Hover Products → Web Apps → Configs (level 3) → assert.
			//   // Then check:
			//   //   level2Side = webAppsContainer.dataset.tnSide (e.g. 'left')
			//   //   level3Side = configsContainer.dataset.tnSide (must be opposite)
			//   //   level3Box.left >= webAppsBox.right - EDGE_FUZZ  (right side) OR
			//   //   level3Box.right <= webAppsBox.left + EDGE_FUZZ  (left side)
		}
	);

} );
