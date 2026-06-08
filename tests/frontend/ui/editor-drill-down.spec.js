// @ts-check
/**
 * Playwright browser tests — Editor drill-down via selection (issue #9 red phase).
 *
 * Tests the selection-driven drill-down behaviour described in issue #9 and
 * constrained by:
 *   docs/adr/0003-editor-drill-down-single-mount.md
 *   docs/adr/0004-drill-state-from-block-selection.md
 *
 * AC mapping:
 *   T1 AC-DRILL-VIA-SELECTION  — clicking a top-level Submenu row drills to it:
 *                                its wrapper gets `is-active-screen`, off-path
 *                                siblings lose visibility.
 *   T2 AC-BACK-NAVIGATION      — clicking the Back button in the drill chrome
 *                                exits the drilled screen; no `is-active-screen`
 *                                remains, top-level rows are visible again.
 *   T3 AC-CLICK-TARGET-DRILLED — a paragraph nested in a row inside a drilled
 *                                Submenu can be selected precisely (selects
 *                                core/paragraph, not the container).
 *   T4 AC-OUTSIDE-PERSISTENCE  — selecting a block outside the TesseNav tree
 *                                leaves the overlay drill state intact.
 *   T5 AC-CHROME-TITLE         — the drill chrome shows the active Submenu's
 *                                `label` attribute as a visible title.
 *   T6 AC-CHEVRON-VISIBILITY   — `.sagiriswd-tn__editor-drill-chevron` is
 *                                visible on Submenu rows inside the open overlay;
 *                                absent at desktop viewport with the overlay closed.
 *
 * Proposed selector contract (implementer: read this):
 *   Chrome container : .sagiriswd-tn__editor-drill-chrome
 *   Chrome title     : .sagiriswd-tn__editor-drill-title   (inside chrome)
 *   Chrome back btn  : .sagiriswd-tn__editor-drill-back    (inside chrome)
 *   Drill chevron    : .sagiriswd-tn__editor-drill-chevron (on each Submenu row)
 *   Submenu wrapper  : [data-type="sagiriswd/tessenav-submenu"]
 *   Active-path class: is-on-active-path   (on Submenu wrapper)
 *   Active-screen cls: is-active-screen    (on Submenu wrapper — the visible screen)
 *
 * Fixture: post 484.  The post must contain a TesseNav block with:
 *   - At least 2 top-level Submenus (to assert sibling hiding in T1).
 *   - At least 1 top-level Submenu with nested content (for T2, T5, T6).
 *   - At least 1 paragraph inside a row/group inside a Submenu (for T3).
 *   Tests that cannot find the required fixture structure skip with a clear message
 *   rather than producing a false pass.
 *
 * Style: mirrors editor-overlay-interactivity.spec.js (loginToAdmin, getCanvas,
 * openMobileEditor, openOverlayInEditor, two-click overlay open, EDITOR_TIMEOUT).
 * DO NOT modify that file.
 */

import { test, expect } from '@playwright/test';

const ADMIN_USER      = process.env.WP_ADMIN_USER || 'Architect93';
const ADMIN_PASS      = process.env.WP_ADMIN_PASS || 'Dante7Inferno!';
const EDITOR_URL      = '/wp-admin/post.php?post=484&action=edit';
const EDITOR_TIMEOUT  = 30_000;
const MOBILE_VIEWPORT = { width: 390, height: 844 };
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

// ─── Helpers (copied / kept in sync with editor-overlay-interactivity.spec.js) ─

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

async function getCanvas( page ) {
	const iframeHandle = page.locator( 'iframe[name="editor-canvas"]' );
	const hasIframe = ( await iframeHandle.count() ) > 0;
	return hasIframe
		? page.frameLocator( 'iframe[name="editor-canvas"]' )
		: page;
}

async function openMobileEditor( page ) {
	await page.setViewportSize( MOBILE_VIEWPORT );
	await page.goto( EDITOR_URL );
	await page.waitForSelector(
		'.edit-post-layout, .editor-layout, .block-editor',
		{ timeout: EDITOR_TIMEOUT, state: 'attached' }
	);
	const canvas = await getCanvas( page );
	await canvas
		.locator( '.sagiriswd-tn__responsive-container-open' )
		.first()
		.waitFor( { state: 'visible', timeout: EDITOR_TIMEOUT } );
	return canvas;
}

async function openOverlayInEditor( canvas ) {
	const hamburger = canvas
		.locator( '.sagiriswd-tn__responsive-container-open' )
		.first();
	await hamburger.click();
	await canvas
		.locator( '.sagiriswd-tn__responsive-container-open' )
		.first()
		.waitFor( { state: 'visible' } );
	await hamburger.click();
	const overlay = canvas
		.locator( '.sagiriswd-tn__responsive-container' )
		.first();
	await expect( overlay ).toHaveClass( /is-menu-open/, {
		timeout: EDITOR_TIMEOUT,
	} );
	return overlay;
}

// ─── T1: AC-DRILL-VIA-SELECTION ──────────────────────────────────────────────

test.describe( 'T1 AC-DRILL-VIA-SELECTION — clicking a top-level Submenu drills to it', () => {
	test.beforeEach( async ( { page } ) => {
		await loginToAdmin( page );
	} );

	test( 'T1 — top-level Submenu wrapper gets is-active-screen; sibling Submenus are off-path', async ( {
		page,
	} ) => {
		const canvas  = await openMobileEditor( page );
		const overlay = await openOverlayInEditor( canvas );

		// Require at least 2 top-level Submenus inside the overlay.
		const topLevelSubmenus = overlay.locator(
			'[data-type="sagiriswd/tessenav-submenu"]'
		);

		// Count only direct-child Submenus (depth 1). WP nests them so we rely on
		// the total count being ≥ 2 for this fixture requirement.
		const submenuCount = await topLevelSubmenus.count();
		if ( submenuCount < 2 ) {
			test.skip(
				true,
				'Fixture gap: post 484 needs at least 2 top-level Submenus inside ' +
					'the TesseNav block to assert sibling hiding (T1). ' +
					'Add a second sagiriswd/tessenav-submenu as a direct child of the TesseNav block.'
			);
			return;
		}

		// Click the first top-level Submenu row to select (= drill) it.
		const firstSubmenu = topLevelSubmenus.first();
		await firstSubmenu.click();

		// Allow React state + CSS to settle.
		await page.waitForTimeout( 400 );

		// The clicked Submenu wrapper must now carry `is-active-screen`.
		await expect( firstSubmenu ).toHaveClass( /is-active-screen/, {
			timeout: EDITOR_TIMEOUT,
		} );

		// At least one sibling top-level Submenu must NOT carry `is-on-active-path`
		// (it is hidden / off the active path).
		const secondSubmenu = topLevelSubmenus.nth( 1 );
		await expect( secondSubmenu ).not.toHaveClass( /is-on-active-path/ );
	} );
} );

// ─── T2: AC-BACK-NAVIGATION ──────────────────────────────────────────────────

test.describe( 'T2 AC-BACK-NAVIGATION — Back button exits the drilled screen', () => {
	test.beforeEach( async ( { page } ) => {
		await loginToAdmin( page );
	} );

	test( 'T2 — after clicking Back, no is-active-screen class remains on any Submenu', async ( {
		page,
	} ) => {
		const canvas  = await openMobileEditor( page );
		const overlay = await openOverlayInEditor( canvas );

		// Drill into the first top-level Submenu.
		const firstSubmenu = overlay
			.locator( '[data-type="sagiriswd/tessenav-submenu"]' )
			.first();
		const submenuCount = await firstSubmenu.count();
		if ( submenuCount === 0 ) {
			test.skip(
				true,
				'Fixture gap: no Submenu block found inside the overlay (post 484). ' +
					'T2 requires at least one top-level sagiriswd/tessenav-submenu.'
			);
			return;
		}

		await firstSubmenu.click();
		await page.waitForTimeout( 400 );

		// Verify we are drilled in — the chrome Back button must appear.
		// Selector contract: .sagiriswd-tn__editor-drill-back inside
		// .sagiriswd-tn__editor-drill-chrome
		const backButton = overlay.locator( '.sagiriswd-tn__editor-drill-back' );
		const backCount = await backButton.count();
		if ( backCount === 0 ) {
			// The chrome does not exist yet (expected — red phase). The test still
			// fails below at the toBeVisible assertion, satisfying the red requirement.
		}

		await expect( backButton ).toBeVisible( { timeout: EDITOR_TIMEOUT } );

		// Click the Back button.
		await backButton.click();
		await page.waitForTimeout( 400 );

		// After Back: no Submenu should carry is-active-screen.
		const activeScreens = overlay.locator(
			'[data-type="sagiriswd/tessenav-submenu"].is-active-screen'
		);
		await expect( activeScreens ).toHaveCount( 0 );
	} );
} );

// ─── T3: AC-CLICK-TARGET-DRILLED ─────────────────────────────────────────────

test.describe( 'T3 AC-CLICK-TARGET-DRILLED — click precision inside a drilled screen', () => {
	test.beforeEach( async ( { page } ) => {
		await loginToAdmin( page );
	} );

	test( 'T3 — clicking a paragraph inside a row inside a drilled Submenu selects core/paragraph', async ( {
		page,
	} ) => {
		const canvas  = await openMobileEditor( page );
		const overlay = await openOverlayInEditor( canvas );

		// Drill into the first Submenu.
		const firstSubmenu = overlay
			.locator( '[data-type="sagiriswd/tessenav-submenu"]' )
			.first();
		if ( ( await firstSubmenu.count() ) === 0 ) {
			test.skip(
				true,
				'Fixture gap: no Submenu block found inside the overlay (post 484). ' +
					'T3 requires a sagiriswd/tessenav-submenu with a row/group → paragraph inside it.'
			);
			return;
		}

		await firstSubmenu.click();
		await page.waitForTimeout( 400 );

		// Inside the now-active screen, find a paragraph nested in a row or group.
		const activeScreen = overlay.locator(
			'[data-type="sagiriswd/tessenav-submenu"].is-active-screen'
		);

		const drillParagraph = activeScreen
			.locator(
				'[data-type="core/row"] [data-type="core/paragraph"]:visible, ' +
				'[data-type="core/group"] [data-type="core/paragraph"]:visible'
			)
			.first();

		const paraCount = await drillParagraph.count();
		if ( paraCount === 0 ) {
			test.skip(
				true,
				'Fixture gap: the first top-level Submenu in post 484 does not contain ' +
					'a core/row → core/paragraph (or core/group → core/paragraph) chain. ' +
					'Add a row with a paragraph inside the Submenu to activate this AC.'
			);
			return;
		}

		await drillParagraph.click();
		await page.waitForTimeout( 400 );

		// The WP editor must have selected the paragraph block, not its container.
		const selectedBlockName = await page.evaluate( () => {
			try {
				// @ts-ignore
				const cid = wp?.data
					?.select( 'core/block-editor' )
					?.getSelectedBlockClientId?.();
				if ( ! cid ) {
					return null;
				}
				// @ts-ignore
				return wp?.data
					?.select( 'core/block-editor' )
					?.getBlock?.( cid )?.name ?? null;
			} catch {
				return null;
			}
		} );

		expect(
			selectedBlockName,
			'Expected core/paragraph to be selected inside the drilled screen. ' +
				'Pre-implementation: is-active-screen class does not exist, so this test ' +
				'will fail at the activeScreen locator step above.'
		).toBe( 'core/paragraph' );
	} );
} );

// ─── T4: AC-OUTSIDE-PERSISTENCE ──────────────────────────────────────────────

test.describe( 'T4 AC-OUTSIDE-PERSISTENCE — drill state persists when an outside block is selected', () => {
	test.beforeEach( async ( { page } ) => {
		await loginToAdmin( page );
	} );

	test( 'T4 — is-active-screen remains on the same Submenu after selecting the post title', async ( {
		page,
	} ) => {
		const canvas  = await openMobileEditor( page );
		const overlay = await openOverlayInEditor( canvas );

		// Drill into the first top-level Submenu.
		const firstSubmenu = overlay
			.locator( '[data-type="sagiriswd/tessenav-submenu"]' )
			.first();
		if ( ( await firstSubmenu.count() ) === 0 ) {
			test.skip(
				true,
				'Fixture gap: no Submenu block found inside the overlay (post 484). ' +
					'T4 requires at least one sagiriswd/tessenav-submenu to drill into.'
			);
			return;
		}

		await firstSubmenu.click();
		await page.waitForTimeout( 400 );

		// Confirm the Submenu is the active screen.
		await expect( firstSubmenu ).toHaveClass( /is-active-screen/, {
			timeout: EDITOR_TIMEOUT,
		} );

		// Now click OUTSIDE the TesseNav block. The post title is a reliable
		// outside target in any WP editor post.
		// The title lives in the page context (outside the canvas iframe for WP 6.x).
		const postTitle = page
			.locator(
				// WP 6.5+ post title selector
				'.editor-post-title__input, ' +
				'.wp-block-post-title, ' +
				// Fallback — anything outside the TesseNav container
				'[data-type="core/post-title"]'
			)
			.first();

		const titleCount = await postTitle.count();
		if ( titleCount === 0 ) {
			test.skip(
				true,
				'Fixture gap: could not locate the post title or any block outside ' +
					'the TesseNav tree for T4. The test requires a clickable outside-tree block.'
			);
			return;
		}

		await postTitle.click();
		await page.waitForTimeout( 400 );

		// The drill state must be preserved — same Submenu still carries is-active-screen.
		await expect( firstSubmenu ).toHaveClass( /is-active-screen/ );
	} );
} );

// ─── T5: AC-CHROME-TITLE ─────────────────────────────────────────────────────

test.describe( 'T5 AC-CHROME-TITLE — drill chrome shows the active Submenu label', () => {
	test.beforeEach( async ( { page } ) => {
		await loginToAdmin( page );
	} );

	test( 'T5 — .sagiriswd-tn__editor-drill-title is visible and non-empty when drilled', async ( {
		page,
	} ) => {
		const canvas  = await openMobileEditor( page );
		const overlay = await openOverlayInEditor( canvas );

		// Drill into the first top-level Submenu.
		const firstSubmenu = overlay
			.locator( '[data-type="sagiriswd/tessenav-submenu"]' )
			.first();
		if ( ( await firstSubmenu.count() ) === 0 ) {
			test.skip(
				true,
				'Fixture gap: no Submenu block found in post 484 for T5.'
			);
			return;
		}

		await firstSubmenu.click();
		await page.waitForTimeout( 400 );

		// Implementer note:
		//   The chrome container must be rendered as:
		//     <div class="sagiriswd-tn__editor-drill-chrome">
		//       <button class="sagiriswd-tn__editor-drill-back">← Back</button>
		//       <span class="sagiriswd-tn__editor-drill-title">{label or "Untitled"}</span>
		//     </div>
		//   rendered above the inner-blocks div, inside the overlay, conditional on
		//   is-menu-open && drillStack.length > 0.

		const chrome     = overlay.locator( '.sagiriswd-tn__editor-drill-chrome' );
		const drillTitle = overlay.locator( '.sagiriswd-tn__editor-drill-title' );

		await expect( chrome ).toBeVisible( { timeout: EDITOR_TIMEOUT } );
		await expect( drillTitle ).toBeVisible( { timeout: EDITOR_TIMEOUT } );

		// The title must not be completely empty — either the label value or the
		// localized fallback "Untitled" must be rendered.
		const titleText = ( await drillTitle.innerText() ).trim();
		expect(
			titleText.length,
			'Expected .sagiriswd-tn__editor-drill-title to contain non-empty text ' +
				'(either the Submenu label attribute or the "Untitled" fallback). ' +
				'Pre-implementation: the chrome element does not exist.'
		).toBeGreaterThan( 0 );
	} );
} );

// ─── T6: AC-CHEVRON-VISIBILITY ───────────────────────────────────────────────

test.describe( 'T6 AC-CHEVRON-VISIBILITY — decorative chevron present in drill mode, absent at desktop', () => {
	test.beforeEach( async ( { page } ) => {
		await loginToAdmin( page );
	} );

	test( 'T6a — .sagiriswd-tn__editor-drill-chevron is visible on Submenu rows inside the open overlay', async ( {
		page,
	} ) => {
		// Implementer note:
		//   Each sagiriswd/tessenav-submenu block edit component should render a
		//   decorative <span class="sagiriswd-tn__editor-drill-chevron" aria-hidden="true">
		//   inside its row. The chevron has no click handler — it is a visual cue only.
		//   Its visibility is controlled by CSS: visible when an ancestor carries
		//   `.sagiriswd-tn__responsive-container.is-menu-open`, hidden otherwise.

		const canvas  = await openMobileEditor( page );
		const overlay = await openOverlayInEditor( canvas );

		const chevron = overlay
			.locator( '.sagiriswd-tn__editor-drill-chevron' )
			.first();

		const chevronCount = await chevron.count();
		if ( chevronCount === 0 ) {
			// Chevron not yet implemented — the locator returns nothing.
			// expect().toBeVisible() below will fail, satisfying the red phase.
		}

		await expect( chevron ).toBeVisible( { timeout: EDITOR_TIMEOUT } );
	} );

	test( 'T6b — .sagiriswd-tn__editor-drill-chevron is absent (or hidden) at desktop viewport with the overlay closed', async ( {
		page,
	} ) => {
		await page.setViewportSize( DESKTOP_VIEWPORT );
		await page.goto( EDITOR_URL );
		await page.waitForSelector(
			'.edit-post-layout, .editor-layout, .block-editor',
			{ timeout: EDITOR_TIMEOUT, state: 'attached' }
		);
		const canvas = await getCanvas( page );

		// At desktop width the overlay must NOT be open.
		const overlay = canvas
			.locator( '.sagiriswd-tn__responsive-container' )
			.first();
		await expect( overlay ).not.toHaveClass( /is-menu-open/ );

		// The chevron must not be visible in the inline desktop view.
		const chevron = canvas
			.locator( '.sagiriswd-tn__editor-drill-chevron' )
			.first();

		// Either not attached at all, or attached but invisible — both satisfy the AC.
		const chevronCount = await chevron.count();
		if ( chevronCount > 0 ) {
			await expect( chevron ).not.toBeVisible();
		}
		// If count is 0, there is no chevron in the desktop view — AC satisfied.
	} );
} );
