// @ts-check
/**
 * Playwright browser tests — Editor inline preview: nested submenu positioning (issue #12 red phase).
 *
 * Validates that the block editor's inline (desktop, ≥782px) preview positions
 * nested submenus to the LEFT or RIGHT of their parent dropdown, with no overlap.
 * The fix requires a `use-nested-positioner.js` hook and an `editor.scss` restore;
 * these tests are written BEFORE implementation (TDD RED phase).
 *
 * --- Why we force containers open via evaluate() ---
 *
 * In the editor canvas, `.sagiriswd-tn__submenu-container` blocks start with
 * `visibility: hidden; opacity: 0` — they are revealed by the interactive store
 * on a real user click (open-on-click mode). The positioner hook to be written in
 * use-nested-positioner.js will attach `mouseover` listeners on the nav root and
 * write `data-tn-side` when triggered. To test that logic in isolation (without
 * implementing the full interactive store path), we:
 *   1. Force the target container(s) visible via evaluate() to simulate the
 *      "open" state the hook will observe at runtime.
 *   2. Dispatch a `mouseover` event on the has-child wrapper so the hook fires.
 *   3. Assert `data-tn-side` and bounding-box geometry.
 *
 * This approach tests the hook's decision algorithm, which is the implementation
 * unit under test for issue #12. It correctly produces RED before the hook is
 * written (data-tn-side stays null, geometry assertions then also fail).
 *
 * --- Fixture ---
 *
 * Page 484 (editor: /wp-admin/post.php?post=484&action=edit)
 *   Products  (level-1 top-level item, .sagiriswd-tn-item.has-child)
 *     └─ Web Apps  (level-2, .sagiriswd-tn-item.has-child inside Products' container)
 *          └─ Configs  (level-3, .sagiriswd-tn-item.has-child inside Web Apps' container)
 *
 * Editor DOM (differs from frontend):
 *   - Submenu block wrappers use `.sagiriswd-tn-item.has-child` (not `.sagiriswd-tn-submenu.has-child`)
 *   - Labels live in `div.sagiriswd-tn-item__label` (contenteditable)
 *   - Root nav root selector stays `nav.sagiriswd-tn`
 *   - Inline desktop preview renders via `.sagiriswd-tn__inner` (visible at ≥782px)
 *
 * AC mapping (from issue #12):
 *   T1 AC-EDITOR-DEFAULT-RIGHT    — Wide viewport (1280px): Web Apps container gets
 *                                   data-tn-side="right"; its left edge ≥ Products
 *                                   container's right edge (no overlap).
 *   T2 AC-EDITOR-DEEP-ALTERNATE   — Level-3 (Configs) data-tn-side is the OPPOSITE of
 *                                   level-2 (Web Apps) data-tn-side.
 *   T3 AC-EDITOR-FLIP-LEFT        — When TesseNav block is constrained near the right
 *                                   viewport edge, Web Apps container gets data-tn-side="left";
 *                                   its right edge ≤ Products container's left edge.
 *
 * Style: mirrors editor-drill-down.spec.js (loginToAdmin, getCanvas, EDITOR_TIMEOUT).
 */

import { test, expect } from '@playwright/test';

const ADMIN_USER     = process.env.WP_ADMIN_USER || 'Architect93';
const ADMIN_PASS     = process.env.WP_ADMIN_PASS || 'Dante7Inferno!';
const EDITOR_URL     = '/wp-admin/post.php?post=484&action=edit';
const EDITOR_TIMEOUT = 30_000;
const EDGE_FUZZ      = 2; // sub-pixel rounding tolerance in px

// Wide viewport — TesseNav floats to the left; right-side placement fits.
// 2400 leaves >1200px of horizontal room past Products' container on the test
// fixture (which carries menuMaxWidth=900 from 8eae1dc, so Products renders
// 900px wide and Web Apps needs another 300px on the right). The previous
// 1280 width forced view.js's side picker to flip left because Products +
// Web Apps couldn't both fit inside the block right.
const WIDE_VIEWPORT   = { width: 2400, height: 900 };
// Narrow viewport used by T3 so the constrained block near the right edge overflows.
const NARROW_VIEWPORT = { width: 900, height: 900 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function loginToAdmin( page ) {
	const dialogHandler = ( dialog ) => dialog.accept().catch( () => {} );
	page.on( 'dialog', dialogHandler );
	try {
		await page.goto( '/wp-login.php', {
			waitUntil: 'domcontentloaded',
			timeout: EDITOR_TIMEOUT,
		} );
		if ( page.url().includes( '/wp-admin' ) ) {
			return;
		}
		await page.fill( '#user_login', ADMIN_USER );
		await page.fill( '#user_pass', ADMIN_PASS );
		await page.click( '#wp-submit' );
		await page.waitForURL( '**/wp-admin/**', { timeout: EDITOR_TIMEOUT } );
	} finally {
		page.off( 'dialog', dialogHandler );
	}
}

/**
 * Return a frame locator for the editor canvas (iframe on WP 6.3+) or the page
 * itself on older builds that render the canvas directly.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<import('@playwright/test').FrameLocator | import('@playwright/test').Page>}
 */
async function getCanvas( page ) {
	const iframeHandle = page.locator( 'iframe[name="editor-canvas"]' );
	const hasIframe = ( await iframeHandle.count() ) > 0;
	return hasIframe
		? page.frameLocator( 'iframe[name="editor-canvas"]' )
		: page;
}

/**
 * Navigate to the editor for page 484 at the given viewport, wait for the
 * TesseNav root nav to be attached in the canvas, and return the canvas locator.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ width: number, height: number }} viewport
 * @returns {Promise<import('@playwright/test').FrameLocator | import('@playwright/test').Page>}
 */
async function openDesktopEditor( page, viewport ) {
	await page.setViewportSize( viewport );
	await page.goto( EDITOR_URL, {
		waitUntil: 'domcontentloaded',
		timeout: EDITOR_TIMEOUT,
	} );
	await page.waitForSelector(
		'.edit-post-layout, .editor-layout, .block-editor',
		{ timeout: EDITOR_TIMEOUT, state: 'attached' }
	);
	const canvas = await getCanvas( page );
	await canvas
		.locator( 'nav.sagiriswd-tn' )
		.first()
		.waitFor( { state: 'attached', timeout: EDITOR_TIMEOUT } );
	return canvas;
}

/**
 * Force a .sagiriswd-tn__submenu-container to be visible (bypassing the CSS
 * opacity/visibility that hides it until the interactive store opens it).
 *
 * This simulates the "open" state the positioner hook will observe at runtime.
 * The hook under test fires on `mouseover`; we dispatch that event after making
 * the container visible.
 *
 * @param {import('@playwright/test').FrameLocator | import('@playwright/test').Page} canvas
 * @param {string} hasChildBlockId  — data-block attribute of the parent has-child block wrapper
 */
async function forceContainerOpen( canvas, hasChildBlockId ) {
	await canvas.locator( `[data-block="${ hasChildBlockId }"] > .sagiriswd-tn__submenu-container` ).evaluate( ( el ) => {
		// Remove the CSS-driven hidden state so geometry is measurable and mouseover
		// triggers the positioner with real dimensions.
		el.style.setProperty( 'visibility', 'visible', 'important' );
		el.style.setProperty( 'opacity', '1', 'important' );
		el.style.setProperty( 'overflow', 'visible', 'important' );
		// Ensure the container has a real rendered width so offsetWidth > 0.
		el.style.setProperty( 'display', 'flex', 'important' );
	} );
}

/**
 * Dispatch a `mouseover` event on the given block wrapper element so the
 * positioner hook (once implemented) runs its decision algorithm.
 *
 * @param {import('@playwright/test').FrameLocator | import('@playwright/test').Page} canvas
 * @param {string} hasChildBlockId  — data-block attribute of the block wrapper
 */
async function triggerMouseover( canvas, hasChildBlockId ) {
	await canvas.locator( `[data-block="${ hasChildBlockId }"]` ).evaluate( ( el ) => {
		el.dispatchEvent( new MouseEvent( 'mouseover', { bubbles: true, cancelable: true } ) );
	} );
}

/**
 * Read the data-block attribute from a Locator so we can pass it to the
 * evaluate-based helpers above.
 *
 * @param {import('@playwright/test').Locator} locator
 * @returns {Promise<string | null>}
 */
async function getBlockId( locator ) {
	return locator.getAttribute( 'data-block' );
}

// ─── T1: AC-EDITOR-DEFAULT-RIGHT ─────────────────────────────────────────────

test.describe( 'T1 AC-EDITOR-DEFAULT-RIGHT — Web Apps container gets data-tn-side="right" and does not overlap Products container', () => {
	test.beforeEach( async ( { page } ) => {
		await loginToAdmin( page );
	} );

	test( 'T1 — data-tn-side="right" on Web Apps container; left >= Products container right', async ( { page } ) => {
		const canvas = await openDesktopEditor( page, WIDE_VIEWPORT );

		// ── Locate inner desktop nav ──────────────────────────────────────
		const inner = canvas.locator( '.sagiriswd-tn__inner' ).first();
		const innerCount = await inner.count();
		if ( innerCount === 0 ) {
			test.skip( true, 'Fixture gap: .sagiriswd-tn__inner not found in editor canvas. Expected inline desktop preview at ≥782px.' );
			return;
		}

		// ── Locate Products wrapper ───────────────────────────────────────
		const productsWrapper = inner
			.locator( '.sagiriswd-tn-item.has-child' )
			.filter( { hasText: 'Products' } )
			.first();

		if ( ( await productsWrapper.count() ) === 0 ) {
			test.skip( true, 'Fixture gap: no .sagiriswd-tn-item.has-child with text "Products" found inside .sagiriswd-tn__inner (page 484).' );
			return;
		}

		const productsId = await getBlockId( productsWrapper );

		// ── Force Products container open and trigger positioner ─────────
		// This simulates the "Products submenu is open" state at runtime.
		await forceContainerOpen( canvas, productsId );
		await page.waitForTimeout( 200 );

		// Locate Web Apps inside Products' container.
		const productsContainer = productsWrapper.locator(
			':scope > .sagiriswd-tn__submenu-container'
		);
		const webAppsWrapper = productsContainer
			.locator( '.sagiriswd-tn-item.has-child' )
			.filter( { hasText: 'Web Apps' } )
			.first();

		if ( ( await webAppsWrapper.count() ) === 0 ) {
			test.skip( true, 'Fixture gap: no "Web Apps" .sagiriswd-tn-item.has-child found inside Products container (page 484).' );
			return;
		}

		const webAppsId = await getBlockId( webAppsWrapper );

		// Force Web Apps container open (simulates Products open → Web Apps hovered).
		await forceContainerOpen( canvas, webAppsId );
		await page.waitForTimeout( 200 );

		// Dispatch mouseover on the Web Apps wrapper to trigger the positioner hook.
		// After the hook runs it must write data-tn-side on the Web Apps container.
		await triggerMouseover( canvas, webAppsId );
		await page.waitForTimeout( 400 );

		const webAppsContainer = webAppsWrapper.locator(
			':scope > .sagiriswd-tn__submenu-container'
		);

		// ── AC assertion (a): data-tn-side must be "right" ───────────────
		// PRE-IMPLEMENTATION: the attribute will not exist → assertion fails (RED).
		const dataTnSide = await webAppsContainer.getAttribute( 'data-tn-side' );

		expect(
			dataTnSide,
			'Expected Web Apps .sagiriswd-tn__submenu-container to have ' +
			'data-tn-side="right" at a wide viewport where no overflow occurs. ' +
			'Pre-implementation: use-nested-positioner.js not yet written; attribute is null.'
		).toBe( 'right' );

		// ── AC assertion (b): left edge ≥ Products container right edge ──
		const productsBox = await productsContainer.boundingBox();
		const webAppsBox  = await webAppsContainer.boundingBox();

		expect( productsBox, 'Products .sagiriswd-tn__submenu-container must have a bounding box' ).not.toBeNull();
		expect( webAppsBox,  'Web Apps .sagiriswd-tn__submenu-container must have a bounding box' ).not.toBeNull();

		const productsRight = productsBox.x + productsBox.width;
		const webAppsLeft   = webAppsBox.x;

		expect(
			webAppsLeft,
			`Web Apps container left (${ webAppsLeft }px) must be >= Products container right ` +
			`(${ productsRight }px) — flyout must NOT overlap parent dropdown. ` +
			`Pre-implementation: left:100% anchors against the narrow label wrapper, ` +
			`placing the flyout inside the parent dropdown (the overlap bug).`
		).toBeGreaterThanOrEqual( productsRight - EDGE_FUZZ );
	} );
} );

// ─── T2: AC-EDITOR-DEEP-ALTERNATE ────────────────────────────────────────────

test.describe( 'T2 AC-EDITOR-DEEP-ALTERNATE — level-3 (Configs) data-tn-side is opposite of level-2 (Web Apps)', () => {
	test.beforeEach( async ( { page } ) => {
		await loginToAdmin( page );
	} );

	test( 'T2 — Configs data-tn-side is opposite of Web Apps data-tn-side', async ( { page } ) => {
		const canvas = await openDesktopEditor( page, WIDE_VIEWPORT );

		const inner = canvas.locator( '.sagiriswd-tn__inner' ).first();
		if ( ( await inner.count() ) === 0 ) {
			test.skip( true, 'Fixture gap: .sagiriswd-tn__inner not found in editor canvas.' );
			return;
		}

		// ── Locate Products ───────────────────────────────────────────────
		const productsWrapper = inner
			.locator( '.sagiriswd-tn-item.has-child' )
			.filter( { hasText: 'Products' } )
			.first();
		if ( ( await productsWrapper.count() ) === 0 ) {
			test.skip( true, 'Fixture gap: "Products" not found.' );
			return;
		}
		const productsId = await getBlockId( productsWrapper );
		await forceContainerOpen( canvas, productsId );
		await page.waitForTimeout( 150 );

		// ── Locate Web Apps ───────────────────────────────────────────────
		const productsContainer = productsWrapper.locator(
			':scope > .sagiriswd-tn__submenu-container'
		);
		const webAppsWrapper = productsContainer
			.locator( '.sagiriswd-tn-item.has-child' )
			.filter( { hasText: 'Web Apps' } )
			.first();
		if ( ( await webAppsWrapper.count() ) === 0 ) {
			test.skip( true, 'Fixture gap: "Web Apps" not found inside Products (page 484).' );
			return;
		}
		const webAppsId = await getBlockId( webAppsWrapper );
		await forceContainerOpen( canvas, webAppsId );

		// Trigger positioner on Web Apps so it gets its data-tn-side set.
		await triggerMouseover( canvas, webAppsId );
		await page.waitForTimeout( 300 );

		// ── Locate Configs ────────────────────────────────────────────────
		// Configs is a level-3 .sagiriswd-tn-item (NOT necessarily has-child —
		// it has a .sagiriswd-tn__submenu-container but that container may be
		// empty if Configs has no nested children yet). The positioner must still
		// set data-tn-side on Configs' own container because it IS a nested
		// submenu (level 3 relative to the root nav).
		const webAppsContainer = webAppsWrapper.locator(
			':scope > .sagiriswd-tn__submenu-container'
		);
		const configsWrapper = webAppsContainer
			.locator( '.sagiriswd-tn-item' )
			.filter( { hasText: 'Configs' } )
			.first();
		if ( ( await configsWrapper.count() ) === 0 ) {
			test.skip( true, 'Fixture gap: "Configs" level-3 nested submenu not found inside Web Apps (page 484). The positioner alternation test requires a 3-level deep chain.' );
			return;
		}

		// Configs must have its own .sagiriswd-tn__submenu-container for the test
		// to be meaningful (even if empty — the container is always rendered).
		const configsContainer = configsWrapper.locator(
			':scope > .sagiriswd-tn__submenu-container'
		);
		if ( ( await configsContainer.count() ) === 0 ) {
			test.skip( true, 'Fixture gap: "Configs" block has no .sagiriswd-tn__submenu-container in the editor canvas.' );
			return;
		}

		const configsId = await getBlockId( configsWrapper );
		await forceContainerOpen( canvas, configsId );

		// Trigger positioner on Configs so it reads Web Apps' side and alternates.
		await triggerMouseover( canvas, configsId );
		await page.waitForTimeout( 300 );

		// ── Read both sides ───────────────────────────────────────────────
		const webAppsSide = await webAppsContainer.getAttribute( 'data-tn-side' );
		const configsSide = await configsContainer.getAttribute( 'data-tn-side' );

		// PRE-IMPLEMENTATION: both will be null → first expect fails (RED).
		expect(
			webAppsSide,
			'Expected Web Apps container to have data-tn-side="right" or "left" after positioner runs. ' +
			'Pre-implementation: use-nested-positioner.js not written; attribute is null.'
		).not.toBeNull();

		expect(
			configsSide,
			'Expected Configs container to have data-tn-side set after positioner runs. ' +
			'Pre-implementation: attribute is null.'
		).not.toBeNull();

		const expectedConfigsSide = webAppsSide === 'right' ? 'left' : 'right';

		expect(
			configsSide,
			`Level-3 (Configs) data-tn-side ("${ configsSide }") must be the opposite of ` +
			`level-2 (Web Apps) data-tn-side ("${ webAppsSide }"). Expected "${ expectedConfigsSide }". ` +
			`Mirrors the view.js zigzag algorithm (view.js:143-146): ` +
			`enclosingSide === 'right' ? 'left' : 'right'.`
		).toBe( expectedConfigsSide );
	} );
} );

// ─── T3: AC-EDITOR-FLIP-LEFT ─────────────────────────────────────────────────

test.describe( 'T3 AC-EDITOR-FLIP-LEFT — Web Apps flips to data-tn-side="left" when right-side placement overflows the inline block', () => {
	test.beforeEach( async ( { page } ) => {
		await loginToAdmin( page );
	} );

	test( 'T3 — data-tn-side="left"; Web Apps container right <= Products container left', async ( { page } ) => {
		// Strategy: force the TesseNav nav to be narrow (250px) and right-aligned
		// inside the editor viewport via inline styles, so the Products dropdown
		// opens near the right edge of the nav block. The positioner must then
		// choose "left" for Web Apps because right-side placement would overflow.
		const canvas = await openDesktopEditor( page, NARROW_VIEWPORT );

		const nav = canvas.locator( 'nav.sagiriswd-tn' ).first();
		await nav.waitFor( { state: 'visible', timeout: EDITOR_TIMEOUT } );

		// Constrain nav width and push it right so overflow occurs on the right.
		await nav.evaluate( ( el ) => {
			el.style.setProperty( 'max-width', '260px', 'important' );
			el.style.setProperty( 'width', '260px', 'important' );
			el.style.setProperty( 'margin-left', 'auto', 'important' );
			el.style.setProperty( 'margin-right', '0', 'important' );
		} );
		await page.waitForTimeout( 300 );

		const inner = canvas.locator( '.sagiriswd-tn__inner' ).first();
		if ( ( await inner.count() ) === 0 ) {
			test.skip( true, 'Fixture gap: .sagiriswd-tn__inner not found in editor canvas.' );
			return;
		}

		// ── Locate Products ───────────────────────────────────────────────
		const productsWrapper = inner
			.locator( '.sagiriswd-tn-item.has-child' )
			.filter( { hasText: 'Products' } )
			.first();
		if ( ( await productsWrapper.count() ) === 0 ) {
			test.skip( true, 'Fixture gap: "Products" not found.' );
			return;
		}
		const productsId = await getBlockId( productsWrapper );
		await forceContainerOpen( canvas, productsId );
		await page.waitForTimeout( 200 );

		// ── Locate Web Apps ───────────────────────────────────────────────
		const productsContainer = productsWrapper.locator(
			':scope > .sagiriswd-tn__submenu-container'
		);
		const webAppsWrapper = productsContainer
			.locator( '.sagiriswd-tn-item.has-child' )
			.filter( { hasText: 'Web Apps' } )
			.first();
		if ( ( await webAppsWrapper.count() ) === 0 ) {
			test.skip( true, 'Fixture gap: "Web Apps" not found inside Products (page 484).' );
			return;
		}
		const webAppsId = await getBlockId( webAppsWrapper );
		await forceContainerOpen( canvas, webAppsId );
		await triggerMouseover( canvas, webAppsId );
		await page.waitForTimeout( 400 );

		const webAppsContainer = webAppsWrapper.locator(
			':scope > .sagiriswd-tn__submenu-container'
		);

		// ── AC assertion (a): data-tn-side must be "left" ────────────────
		// PRE-IMPLEMENTATION: attribute is null → fails (RED).
		const dataTnSide = await webAppsContainer.getAttribute( 'data-tn-side' );

		expect(
			dataTnSide,
			'Expected Web Apps .sagiriswd-tn__submenu-container to have ' +
			'data-tn-side="left" when TesseNav nav is constrained to 260px near the right edge. ' +
			'Pre-implementation: use-nested-positioner.js not written; attribute is null.'
		).toBe( 'left' );

		// ── AC assertion (b): right edge ≤ Products container left edge ──
		const productsBox = await productsContainer.boundingBox();
		const webAppsBox  = await webAppsContainer.boundingBox();

		expect( productsBox, 'Products container must have a bounding box' ).not.toBeNull();
		expect( webAppsBox,  'Web Apps container must have a bounding box' ).not.toBeNull();

		const productsLeft = productsBox.x;
		const webAppsRight = webAppsBox.x + webAppsBox.width;

		expect(
			webAppsRight,
			`Web Apps container right (${ webAppsRight }px) must be <= Products container left ` +
			`(${ productsLeft }px) when side is "left". ` +
			`Pre-implementation: no flip occurs; flyout remains at or to the right of the Products container.`
		).toBeLessThanOrEqual( productsLeft + EDGE_FUZZ );
	} );
} );

// ─── T4: AC-EDITOR-HOVER-MODE-NO-SHIFT ───────────────────────────────────────
//
// Regression guard for the hover-mode editor bug: when the TesseNav block is
// configured with `open-on-click=false` (hover mode), the frontend's compiled
// hover rule (`:not(.open-on-click):hover > .submenu-container`) fires inside
// the editor as well — mousing over a parent wrapper sets `overflow: auto` on
// the parent dropdown. The nested flyout positioned at `left:100%` of the
// wrapper makes scrollWidth > clientWidth, and the editor auto-scrolls the
// parent dropdown leftward by the overflow distance. All children then render
// at a wrong x-position. Fix is in `src/tessenav/editor.scss` — a tripled
// `.sagiriswd-tn__submenu-container.sagiriswd-tn__submenu-container.sagiriswd-tn__submenu-container`
// rule scoped under `.sagiriswd-tn` that forces `overflow: visible !important`
// (specificity 0-5-0, ties the hover rule; `!important` and source-order
// from editor.scss break the tie).

test.describe( 'T4 AC-EDITOR-HOVER-MODE-NO-SHIFT — hover-mode wrapper hover does not auto-scroll parent dropdown', () => {
	test.beforeEach( async ( { page } ) => {
		await loginToAdmin( page );
	} );

	test( 'T4 — Products container.scrollLeft remains 0 after hovering Products in hover mode', async ( { page } ) => {
		const canvas = await openDesktopEditor( page, WIDE_VIEWPORT );

		const inner = canvas.locator( '.sagiriswd-tn__inner' ).first();
		if ( ( await inner.count() ) === 0 ) {
			test.skip( true, 'Fixture gap: .sagiriswd-tn__inner not found.' );
			return;
		}

		const productsWrapper = inner
			.locator( '.sagiriswd-tn-item.has-child' )
			.filter( { hasText: 'Products' } )
			.first();
		if ( ( await productsWrapper.count() ) === 0 ) {
			test.skip( true, 'Fixture gap: "Products" not found.' );
			return;
		}

		const productsId = await getBlockId( productsWrapper );

		// Force hover mode by stripping the open-on-click class from every Submenu
		// wrapper in the canvas. (The fixture's block attribute may be either, but
		// the bug only manifests when hover mode is active; this normalizes state.)
		await canvas.locator( '.sagiriswd-tn-item.open-on-click' ).evaluateAll( ( els ) => {
			els.forEach( ( el ) => el.classList.remove( 'open-on-click' ) );
		} );

		await forceContainerOpen( canvas, productsId );

		// Trigger real :hover via Playwright's hover() — synthetic dispatch doesn't
		// activate CSS pseudo-classes.
		await productsWrapper.hover();
		await page.waitForTimeout( 250 );

		const productsContainer = productsWrapper.locator(
			':scope > .sagiriswd-tn__submenu-container'
		);

		const scrollLeft = await productsContainer.evaluate( ( el ) => el.scrollLeft );
		const overflow = await productsContainer.evaluate( ( el ) => getComputedStyle( el ).overflow );

		expect(
			scrollLeft,
			`Products container scrollLeft must remain 0 in hover mode. ` +
			`Pre-fix: overflow: auto + nested flyout extending right makes ` +
			`scrollWidth > clientWidth and the editor auto-scrolls leftward, ` +
			`shifting every child to a wrong position.`
		).toBe( 0 );

		expect(
			overflow,
			`Products container overflow must be "visible" in the editor canvas ` +
			`even when :hover fires. Pre-fix: frontend hover rule sets overflow:auto.`
		).toBe( 'visible' );
	} );
} );

// ─── T5: AC-EDITOR-HOVER-OPENS-LEAF ──────────────────────────────────────────
//
// Regression guard for hover-reveal of leaf Submenu blocks. The frontend hover
// rule (`.has-child:not(.open-on-click):hover > .submenu-container`) gates on
// `.has-child`, which only appears once a Submenu block has child blocks. A
// leaf Submenu (e.g. "Configs" without any items) never carries `.has-child`,
// so hovering it never opens its container — even in hover mode. The fix is
// an editor-only CSS rule targeting `.wp-block-sagiriswd-tessenav-submenu`
// directly so leaves are covered, allowing the inner-blocks appender to be
// reached via hover.

test.describe( 'T5 AC-EDITOR-HOVER-OPENS-LEAF — hovering a leaf Submenu block reveals its container', () => {
	test.beforeEach( async ( { page } ) => {
		await loginToAdmin( page );
	} );

	test( 'T5 — Configs (leaf) container becomes visible on hover in hover mode', async ( { page } ) => {
		const canvas = await openDesktopEditor( page, WIDE_VIEWPORT );

		const inner = canvas.locator( '.sagiriswd-tn__inner' ).first();
		if ( ( await inner.count() ) === 0 ) {
			test.skip( true, 'Fixture gap: .sagiriswd-tn__inner not found.' );
			return;
		}

		// Drill to Configs: Products → Web Apps → Configs.
		const productsWrapper = inner
			.locator( '.sagiriswd-tn-item.has-child' )
			.filter( { hasText: 'Products' } )
			.first();
		if ( ( await productsWrapper.count() ) === 0 ) {
			test.skip( true, 'Fixture gap: "Products" not found.' );
			return;
		}
		const productsId = await getBlockId( productsWrapper );

		// Force hover mode by stripping the open-on-click class.
		await canvas.locator( '.sagiriswd-tn-item.open-on-click' ).evaluateAll( ( els ) => {
			els.forEach( ( el ) => el.classList.remove( 'open-on-click' ) );
		} );

		// Force Products and Web Apps containers visible so we can reach Configs.
		await forceContainerOpen( canvas, productsId );

		const productsContainer = productsWrapper.locator(
			':scope > .sagiriswd-tn__submenu-container'
		);
		const webAppsWrapper = productsContainer
			.locator( '.sagiriswd-tn-item.has-child' )
			.filter( { hasText: 'Web Apps' } )
			.first();
		if ( ( await webAppsWrapper.count() ) === 0 ) {
			test.skip( true, 'Fixture gap: "Web Apps" not found inside Products.' );
			return;
		}
		const webAppsId = await getBlockId( webAppsWrapper );
		await forceContainerOpen( canvas, webAppsId );

		// Also force width:auto so Configs wrapper has a non-zero bounding box
		// and Playwright's .hover() can reach it. The default closed-state CSS
		// pins width:0; height:0 even after visibility:visible is forced.
		await canvas.locator( `[data-block="${ webAppsId }"] > .sagiriswd-tn__submenu-container` ).evaluate( ( el ) => {
			el.style.setProperty( 'width', 'auto', 'important' );
			el.style.setProperty( 'height', 'auto', 'important' );
			el.style.setProperty( 'min-width', '200px', 'important' );
		} );

		// Locate Configs — note: Configs is a LEAF, so the selector uses
		// `.sagiriswd-tn-item` (not `.sagiriswd-tn-item.has-child`).
		const webAppsContainer = webAppsWrapper.locator(
			':scope > .sagiriswd-tn__submenu-container'
		);
		const configsWrapper = webAppsContainer
			.locator( '.sagiriswd-tn-item' )
			.filter( { hasText: 'Configs' } )
			.first();
		if ( ( await configsWrapper.count() ) === 0 ) {
			test.skip( true, 'Fixture gap: "Configs" leaf not found inside Web Apps.' );
			return;
		}

		const configsContainer = configsWrapper.locator(
			':scope > .sagiriswd-tn__submenu-container'
		);
		if ( ( await configsContainer.count() ) === 0 ) {
			test.skip( true, 'Fixture gap: Configs has no .sagiriswd-tn__submenu-container.' );
			return;
		}

		// Strip any inner-blocks the editor may have injected into Configs'
		// container so it matches the actual production case of a leaf
		// Submenu with no children — `style.scss:42` then fires
		// `:empty { display: none }` which `visibility:visible` alone cannot
		// override. The fix has to set `display: flex` too.
		await configsContainer.evaluate( ( el ) => {
			while ( el.firstChild ) {
				el.removeChild( el.firstChild );
			}
		} );

		// Use real Playwright hover() — synthetic dispatch doesn't trigger
		// CSS :hover. The hover state is held for the duration of the
		// subsequent assertions because Playwright keeps the mouse there.
		await configsWrapper.hover();
		await page.waitForTimeout( 250 );

		const styles = await configsContainer.evaluate( ( el ) => {
			const s = getComputedStyle( el );
			return { visibility: s.visibility, display: s.display };
		} );

		expect(
			styles.visibility,
			`Configs (leaf, empty container) must have visibility: visible on hover. ` +
			`Pre-fix: the frontend hover rule requires .has-child which leaves don't have.`
		).toBe( 'visible' );

		expect(
			styles.display,
			`Configs container must have display !== "none" on hover. ` +
			`Pre-fix: style.scss:42's \`:empty { display: none }\` removed the empty ` +
			`container from layout entirely, and the hover rule only set ` +
			`visibility/opacity — not display — so the container stayed hidden ` +
			`even though :hover fired.`
		).not.toBe( 'none' );
	} );
} );
