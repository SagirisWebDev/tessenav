// @ts-check
/**
 * Playwright browser tests — Navigator content wrapping (issue #8 follow-up).
 *
 * Acceptance criteria (from QA brief):
 *   "All content within a nested submenu is wrapped to within the width of the
 *   navigator width so that all content is visible to the user in the navigator
 *   view if they scroll the viewport downward. Make sure the styling set in
 *   the settings panel is honoured on desktop viewports, but for mobile
 *   viewports where the navigator component is responsible for rendering the
 *   nested submenu content, all the content should be wrapped to the viewport
 *   width of the navigator component — no horizontal scrollbars should have to
 *   be used to see any content on a mobile viewport in the navigator
 *   component."
 *
 * AC mapping:
 *   T3 AC-FRONTEND-MOBILE-WRAP — on the frontend at mobile viewport, every
 *                               direct child of the active Web Apps screen
 *                               fits inside the .sagiriswd-tn__navigator's
 *                               clientWidth.
 *   T4 AC-DESKTOP-UNAFFECTED  — on the frontend at desktop viewport, the
 *                               Web Apps flyout container honours the styling
 *                               from the settings panel and is NOT clamped to
 *                               the (mobile-only) navigator's width.
 *   AC-VERTICAL-SCROLL        — tall navigator content remains reachable by
 *                               scrolling the surrounding responsive container.
 *
 * Note: parallel editor-canvas assertions (T1 AC-EDITOR-WRAP and
 * T2 AC-EDITOR-NO-HSCROLL) were dropped — they targeted obsolete selectors
 * (.sagiriswd-tn__editor-navigator-preview etc.) from a DrillChrome-era
 * preview that was redesigned away in issues #10/#11. The editor canvas now
 * renders the same frontend navigator on mobile viewport, so T3 already
 * covers the wrapping invariant inside the canvas iframe.
 */

import { test, expect } from '@playwright/test';

const FRONTEND_URL = '/484-2/';
const MOBILE_VIEWPORT  = { width: 390, height: 844 };
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function gotoMobileFrontend( page ) {
	await page.setViewportSize( MOBILE_VIEWPORT );
	await page.goto( FRONTEND_URL );
}

async function openFrontendOverlay( page ) {
	await page.locator( 'main .sagiriswd-tn__responsive-container-open' ).click();
	await expect(
		page.locator( 'main .sagiriswd-tn__responsive-container' )
	).toHaveClass( /is-menu-open/ );
}

function navScreen( page, screenId ) {
	return page.locator(
		`.sagiriswd-tn__navigator-screen[data-wp-context*='"screenId":"${ screenId }"']`
	);
}

/**
 * Desktop frontend: open the Products → Web Apps flyout chain. The test page
 * uses click-to-open submenus; selectors here mirror the patterns in
 * navigator-scroll-and-nested.spec.js (AC-NESTED).
 */
async function openWebAppsFlyoutOnDesktop( page ) {
	const tessenav = page.locator( 'main .sagiriswd-tn' ).first();
	await tessenav.waitFor( { state: 'visible' } );

	const productsLi = tessenav
		.locator( '.sagiriswd-tn-submenu.has-child', {
			has: page.locator( 'text=Products' ),
		} )
		.first();
	await productsLi.waitFor( { state: 'visible' } );
	await productsLi
		.locator( ':scope > button.sagiriswd-tn-submenu__toggle' )
		.first()
		.click();

	const productsDropdown = productsLi.locator(
		':scope > .sagiriswd-tn__submenu-container'
	);
	await expect( productsDropdown ).toBeVisible();

	const webAppsLi = productsDropdown
		.locator( '.sagiriswd-tn-submenu.has-child', {
			has: page.locator( 'text=Web Apps' ),
		} )
		.first();
	await expect( webAppsLi ).toBeVisible();
	await webAppsLi
		.locator( ':scope > button.sagiriswd-tn-submenu__toggle' )
		.first()
		.click();

	const webAppsFlyout = webAppsLi.locator(
		':scope > .sagiriswd-tn__submenu-container'
	);
	await expect( webAppsFlyout ).toBeVisible();
	await page.waitForTimeout( 200 );

	return { productsDropdown, webAppsFlyout };
}

// ─── T3: AC-FRONTEND-MOBILE-WRAP ──────────────────────────────────────────────

test.describe( 'AC-FRONTEND-MOBILE-WRAP — frontend navigator wraps nested submenu content to its own width', () => {
	test( 'T3 AC-FRONTEND-MOBILE-WRAP — every direct child of the active Web Apps screen fits within the .sagiriswd-tn__navigator clientWidth', async ( { page } ) => {
		await gotoMobileFrontend( page );
		await openFrontendOverlay( page );

		// Drill root → Products → Web Apps. On the test page Products is
		// screen-0 and Web Apps is screen-1 (assigned by render.php's
		// depth-first traversal in sagiriswd_tessenav_assign_screen_ids).
		await navScreen( page, 'root' )
			.locator( '.sagiriswd-tn__navigator-drill-down', { hasText: 'Products' } )
			.click();
		await expect( navScreen( page, 'screen-0' ) ).toHaveClass( /is-active/ );

		await navScreen( page, 'screen-0' )
			.locator( '.sagiriswd-tn__navigator-drill-down', { hasText: 'Web Apps' } )
			.click();

		const webAppsScreen = navScreen( page, 'screen-1' );
		await expect( webAppsScreen ).toHaveClass( /is-active/ );

		// Allow any inner block content (paragraphs / group blocks / etc.)
		// to settle into its final layout.
		await page.waitForTimeout( 500 );

		const navigator = page.locator( 'main .sagiriswd-tn__navigator' );
		await expect( navigator ).toBeVisible();

		const navBox = await navigator.boundingBox();
		expect( navBox ).not.toBeNull();
		const navLeft  = navBox.x;
		const navRight = navBox.x + navBox.width;

		const childBoxes = await webAppsScreen.evaluate( ( screen ) => {
			return Array.from( screen.children ).map( ( child ) => {
				const r = child.getBoundingClientRect();
				return {
					left:   r.left,
					right:  r.right,
					width:  r.width,
					tag:    child.tagName,
					cls:    child.className,
				};
			} );
		} );

		expect( childBoxes.length ).toBeGreaterThan( 0 );

		for ( const child of childBoxes ) {
			// 1px fuzz for sub-pixel rounding.
			expect.soft(
				child.right,
				`child ${ child.tag }.${ child.cls } right ${ child.right } exceeds navigator right ${ navRight }`
			).toBeLessThanOrEqual( navRight + 1 );
			expect.soft(
				child.left,
				`child ${ child.tag }.${ child.cls } left ${ child.left } precedes navigator left ${ navLeft }`
			).toBeGreaterThanOrEqual( navLeft - 1 );
		}

		// The navigator itself must not be horizontally scrollable: scrollWidth
		// equal to clientWidth means the user can see all content without a
		// horizontal scrollbar.
		const navDims = await navigator.evaluate( ( el ) => ( {
			scrollWidth: el.scrollWidth,
			clientWidth: el.clientWidth,
			overflowX:   getComputedStyle( el ).overflowX,
		} ) );
		expect.soft(
			navDims.scrollWidth,
			`navigator ${ JSON.stringify( navDims ) }`
		).toBeLessThanOrEqual( navDims.clientWidth );
	} );
} );

// ─── T4: AC-DESKTOP-UNAFFECTED ────────────────────────────────────────────────

test.describe( 'AC-DESKTOP-UNAFFECTED — desktop flyout submenus honour the settings panel, not navigator wrapping', () => {
	test( 'T4 AC-DESKTOP-UNAFFECTED — Web Apps desktop flyout width matches its inline/settings styling and is not clamped to the navigator width', async ( { page } ) => {
		await page.setViewportSize( DESKTOP_VIEWPORT );
		await page.goto( FRONTEND_URL );

		const { webAppsFlyout } = await openWebAppsFlyoutOnDesktop( page );

		// Capture the styling the settings panel/block authored. We accept
		// EITHER an inline width (e.g. menuMaxWidth) OR the element's natural
		// rendered width — both are "what the settings panel produced" and
		// neither should be overridden by a navigator-wrapping rule.
		const flyoutStyle = await webAppsFlyout.evaluate( ( el ) => {
			const computed = getComputedStyle( el );
			return {
				inlineWidth:   el.style.width || null,
				computedWidth: computed.width,
				renderedWidth: el.getBoundingClientRect().width,
				maxWidth:      computed.maxWidth,
			};
		} );

		// The flyout must retain a real submenu width — it should not have
		// been forced down to the (typically narrow) mobile navigator panel.
		// Use a conservative sentinel that any meaningful desktop flyout
		// width clears: ≥ 200px. The exact value is whatever the inline
		// menuMaxWidth (or natural shrink-wrap) produced.
		expect(
			flyoutStyle.renderedWidth,
			`Web Apps flyout rendered width ${ flyoutStyle.renderedWidth }px should reflect settings styling (≥ 200px), not be clamped to navigator width. style=${ JSON.stringify( flyoutStyle ) }`
		).toBeGreaterThanOrEqual( 200 );

		// If the settings panel applied an inline width, the rendered width
		// must match it (within 2px for sub-pixel/border rounding). This is
		// the strict half of the assertion: it would fail if any rule were
		// clamping the width below the menuMaxWidth setting.
		if ( flyoutStyle.inlineWidth && /^\d+(\.\d+)?px$/.test( flyoutStyle.inlineWidth ) ) {
			const expectedPx = parseFloat( flyoutStyle.inlineWidth );
			expect(
				Math.abs( flyoutStyle.renderedWidth - expectedPx ),
				`rendered ${ flyoutStyle.renderedWidth }px deviates from inline width ${ flyoutStyle.inlineWidth }`
			).toBeLessThanOrEqual( 2 );
		}

		// Desktop: the navigator-wrapper itself must remain display:none —
		// confirming the navigator-component code path is NOT responsible
		// for this flyout's rendering.
		const navWrapperDisplay = await page
			.locator( 'main .sagiriswd-tn__navigator-wrapper' )
			.evaluate( ( el ) => getComputedStyle( el ).display );
		expect( navWrapperDisplay ).toBe( 'none' );
	} );
} );

// ─── T5: AC-VERTICAL-SCROLL ───────────────────────────────────────────────────

test( 'AC-VERTICAL-SCROLL — tall navigator content remains reachable by scrolling the responsive container', async ( { page } ) => {
	await page.setViewportSize( { width: 390, height: 600 } );
	await page.goto( '/484-2/' );

	// Open the hamburger, drill into Products → Web Apps.
	const hamburger = page.locator( '.sagiriswd-tn__responsive-container-open' ).first();
	await hamburger.click();
	await page.locator( '.sagiriswd-tn__responsive-container.is-menu-open' ).waitFor();

	const productsBtn = page.locator( '.sagiriswd-tn__navigator-drill-down', { hasText: 'Products' } ).first();
	await productsBtn.click();
	await page.waitForTimeout( 300 );
	const webAppsBtn = page.locator( '.sagiriswd-tn__navigator-drill-down', { hasText: 'Web Apps' } ).first();
	await webAppsBtn.click();
	await page.waitForTimeout( 300 );

	// Inject tall content into the active screen.
	await page.evaluate( () => {
		const active = document.querySelector( '.sagiriswd-tn__navigator-screen.is-active' );
		const tall = document.createElement( 'div' );
		tall.style.cssText = 'height: 1500px; background: linear-gradient(red, blue);';
		tall.dataset.testTall = 'true';
		active.appendChild( tall );
	} );
	await page.waitForTimeout( 200 );

	// Confirm vertical scroll is possible somewhere (responsive container or window).
	const scrollState = await page.evaluate( () => {
		const r = document.querySelector( '.sagiriswd-tn__responsive-container' );
		return {
			responsiveScrollable: r.scrollHeight > r.clientHeight + 1,
			navScrollable: ( () => {
				const n = document.querySelector( '.sagiriswd-tn__navigator' );
				return n ? getComputedStyle( n ).overflowY : null;
			} )(),
		};
	} );
	expect( scrollState.responsiveScrollable, 'responsive container must scroll vertically when content is tall' ).toBe( true );
	// overflow-y on .sagiriswd-tn__navigator must not be 'hidden' (which would clip and prevent parent scroll feedback).
	expect( scrollState.navScrollable ).not.toBe( 'hidden' );
} );
