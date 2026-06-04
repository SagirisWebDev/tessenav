// @ts-check
/**
 * Playwright browser tests — TesseNav Navigator UX (issue #6)
 *
 * AC coverage:
 *   AC1  — mobile overlay opens to root screen with all allowed top-level items
 *   AC2  — tapping a drill-down button navigates to that submenu's screen
 *   AC3  — nested tessenav-submenu items render as drill-down buttons at the top
 *   AC4  — other inner block content renders below the drill-down buttons
 *   AC5  — non-root screens have a back button that returns to the parent screen
 *   AC6  — forward navigation adds is-navigating-forward to .sagiriswd-tn__navigator
 *   AC7  — back navigation adds is-navigating-back to .sagiriswd-tn__navigator
 *   AC8  — closing the overlay resets navigator to root screen
 *   AC9  — desktop: navigator hidden, normal container visible, flyout submenu works
 *   AC10 — free-tier expired: only 3 top-level submenus in HTML; Blog & Contact absent
 *
 * Test page: http://localhost:10043/484-2/
 *   - 5 top-level submenus (Products, Services, About, Blog, Contact)
 *   - Free-tier / no premium + grace period expired → only 3 render
 *   - Products has 2 nested child submenus (Web Apps, Mobile) + a paragraph block
 */

import { test, expect } from '@playwright/test';

const PAGE_URL = '/484-2/';
const MOBILE_VIEWPORT  = { width: 390, height: 844 };
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Set mobile viewport and navigate to test page.
 */
async function gotoMobile( page ) {
	await page.setViewportSize( MOBILE_VIEWPORT );
	await page.goto( PAGE_URL );
}

/**
 * Click the TesseNav "Open menu" button (scoped to <main>) and wait for overlay.
 * There are two "Open menu" buttons on the page; we must use the one inside <main>.
 */
async function openOverlay( page ) {
	await page.locator( 'main .sagiriswd-tn__responsive-container-open' ).click();
	await expect(
		page.locator( 'main .sagiriswd-tn__responsive-container' )
	).toHaveClass( /is-menu-open/ );
}

/**
 * Locator for a specific navigator screen, matched by screenId value in data-wp-context.
 */
function navScreen( page, screenId ) {
	return page.locator(
		`.sagiriswd-tn__navigator-screen[data-wp-context*='"screenId":"${ screenId }"']`
	);
}

// ─── AC1: Root screen active on open, shows allowed top-level items ────────────

test( 'AC1 — root screen is active on open and shows 3 top-level drill-down buttons', async ( { page } ) => {
	await gotoMobile( page );
	await openOverlay( page );

	const rootScreen = navScreen( page, 'root' );

	// Root screen is the active screen.
	await expect( rootScreen ).toHaveClass( /is-active/ );

	// Exactly 3 allowed drill-down buttons (free-tier limit).
	const drillDowns = rootScreen.locator( '.sagiriswd-tn__navigator-drill-down' );
	await expect( drillDowns ).toHaveCount( 3 );

	// Correct labels.
	const labels = await drillDowns.allInnerTexts();
	const trimmed = labels.map( ( l ) => l.trim() );
	expect( trimmed ).toContain( 'Products' );
	expect( trimmed ).toContain( 'Services' );
	expect( trimmed ).toContain( 'About' );

	// Root screen has NO back button.
	await expect( rootScreen.locator( '.sagiriswd-tn__navigator-back' ) ).toHaveCount( 0 );
} );

// ─── AC2: Tapping a drill-down navigates to its screen ────────────────────────

test( 'AC2 — tapping "Products" drill-down activates the Products screen', async ( { page } ) => {
	await gotoMobile( page );
	await openOverlay( page );

	await navScreen( page, 'root' )
		.locator( '.sagiriswd-tn__navigator-drill-down', { hasText: 'Products' } )
		.click();

	// Root is no longer active; Products screen (screen-0) is.
	await expect( navScreen( page, 'root' ) ).not.toHaveClass( /is-active/ );
	await expect( navScreen( page, 'screen-0' ) ).toHaveClass( /is-active/ );
} );

// ─── AC3: Nested submenu children appear as drill-down buttons at the top ─────

test( 'AC3 — Products screen shows nested submenus as drill-down buttons before other content', async ( { page } ) => {
	await gotoMobile( page );
	await openOverlay( page );

	await navScreen( page, 'root' )
		.locator( '.sagiriswd-tn__navigator-drill-down', { hasText: 'Products' } )
		.click();

	const productsScreen = navScreen( page, 'screen-0' );
	await expect( productsScreen ).toHaveClass( /is-active/ );

	// Two nested submenu drill-downs: Web Apps, Mobile.
	const drillDowns = productsScreen.locator( '.sagiriswd-tn__navigator-drill-down' );
	await expect( drillDowns ).toHaveCount( 2 );
	const labels = await drillDowns.allInnerTexts();
	expect( labels.map( ( l ) => l.trim() ) ).toContain( 'Web Apps' );
	expect( labels.map( ( l ) => l.trim() ) ).toContain( 'Mobile' );

	// Drill-down buttons must all precede non-button content in DOM order.
	const orderOk = await productsScreen.evaluate( ( el ) => {
		// Skip index 0 (back button); check the remaining children.
		const kids = [ ...el.children ].slice( 1 );
		let seenNonDrillDown = false;
		for ( const child of kids ) {
			const isDrillDown = child.classList.contains( 'sagiriswd-tn__navigator-drill-down' );
			if ( seenNonDrillDown && isDrillDown ) return false;
			if ( ! isDrillDown ) seenNonDrillDown = true;
		}
		return true;
	} );
	expect( orderOk ).toBe( true );
} );

// ─── AC4: Non-submenu inner block content renders below drill-down buttons ─────

test( 'AC4 — paragraph block in Products screen appears below all drill-down buttons', async ( { page } ) => {
	await gotoMobile( page );
	await openOverlay( page );

	await navScreen( page, 'root' )
		.locator( '.sagiriswd-tn__navigator-drill-down', { hasText: 'Products' } )
		.click();

	const productsScreen = navScreen( page, 'screen-0' );
	await expect( productsScreen ).toHaveClass( /is-active/ );

	// The "Explore our range" paragraph exists inside this screen.
	await expect( productsScreen.locator( 'p' ) ).toContainText( 'Explore our range' );

	// Paragraph DOM index > last drill-down DOM index.
	const order = await productsScreen.evaluate( ( el ) => {
		const kids = [ ...el.children ];
		const drillIdxs = kids
			.map( ( c, i ) => ( c.classList.contains( 'sagiriswd-tn__navigator-drill-down' ) ? i : -1 ) )
			.filter( ( i ) => i >= 0 );
		const paraIdxs = kids
			.map( ( c, i ) => ( c.tagName === 'P' ? i : -1 ) )
			.filter( ( i ) => i >= 0 );
		return {
			lastDrillDown: Math.max( ...drillIdxs ),
			firstPara:     Math.min( ...paraIdxs ),
		};
	} );
	expect( order.firstPara ).toBeGreaterThan( order.lastDrillDown );
} );

// ─── AC5: Non-root screens have a back button returning to parent ──────────────

test( 'AC5 — Products screen back button returns to root', async ( { page } ) => {
	await gotoMobile( page );
	await openOverlay( page );

	await navScreen( page, 'root' )
		.locator( '.sagiriswd-tn__navigator-drill-down', { hasText: 'Products' } )
		.click();

	const productsScreen = navScreen( page, 'screen-0' );
	await expect( productsScreen ).toHaveClass( /is-active/ );

	// Back button is present exactly once.
	await expect( productsScreen.locator( '.sagiriswd-tn__navigator-back' ) ).toHaveCount( 1 );

	await productsScreen.locator( '.sagiriswd-tn__navigator-back' ).click();

	await expect( navScreen( page, 'root' ) ).toHaveClass( /is-active/ );
	await expect( productsScreen ).not.toHaveClass( /is-active/ );
} );

test( 'AC5 — Web Apps (nested) back button returns to Products, not root', async ( { page } ) => {
	await gotoMobile( page );
	await openOverlay( page );

	// Navigate: root → Products → Web Apps.
	await navScreen( page, 'root' )
		.locator( '.sagiriswd-tn__navigator-drill-down', { hasText: 'Products' } )
		.click();
	await navScreen( page, 'screen-0' )
		.locator( '.sagiriswd-tn__navigator-drill-down', { hasText: 'Web Apps' } )
		.click();

	const webAppsScreen = navScreen( page, 'screen-1' );
	await expect( webAppsScreen ).toHaveClass( /is-active/ );

	await webAppsScreen.locator( '.sagiriswd-tn__navigator-back' ).click();

	// Should land on Products (screen-0), not root.
	await expect( navScreen( page, 'screen-0' ) ).toHaveClass( /is-active/ );
	await expect( navScreen( page, 'root' ) ).not.toHaveClass( /is-active/ );
	await expect( webAppsScreen ).not.toHaveClass( /is-active/ );
} );

// ─── AC6: Forward navigation adds is-navigating-forward ───────────────────────

test( 'AC6 — is-navigating-forward class is set on navigator after forward transition', async ( { page } ) => {
	await gotoMobile( page );
	await openOverlay( page );

	// The Interactivity API applies data-wp-class bindings asynchronously.
	// is-navigating-forward persists after navigation completes, so we can
	// simply await it via Playwright's built-in retry.
	await navScreen( page, 'root' )
		.locator( '.sagiriswd-tn__navigator-drill-down', { hasText: 'Products' } )
		.click();

	// Class must be present on the navigator element after forward navigation.
	await expect( page.locator( 'main .sagiriswd-tn__navigator' ) ).toHaveClass(
		/is-navigating-forward/
	);

	// Confirm destination screen is active.
	await expect( navScreen( page, 'screen-0' ) ).toHaveClass( /is-active/ );
} );

// ─── AC7: Back navigation adds is-navigating-back ────────────────────────────

test( 'AC7 — is-navigating-back class is set on navigator after back transition', async ( { page } ) => {
	await gotoMobile( page );
	await openOverlay( page );

	// Navigate forward to Products first.
	await navScreen( page, 'root' )
		.locator( '.sagiriswd-tn__navigator-drill-down', { hasText: 'Products' } )
		.click();
	await expect( navScreen( page, 'screen-0' ) ).toHaveClass( /is-active/ );

	// Navigate back.
	await navScreen( page, 'screen-0' ).locator( '.sagiriswd-tn__navigator-back' ).click();

	// is-navigating-back persists after navigation completes.
	await expect( page.locator( 'main .sagiriswd-tn__navigator' ) ).toHaveClass(
		/is-navigating-back/
	);

	// Root screen is active again.
	await expect( navScreen( page, 'root' ) ).toHaveClass( /is-active/ );
} );

// ─── AC8: Closing overlay resets navigator to root ────────────────────────────

test( 'AC8 — closing the overlay resets navigator to root on re-open', async ( { page } ) => {
	await gotoMobile( page );
	await openOverlay( page );

	// Navigate away from root.
	await navScreen( page, 'root' )
		.locator( '.sagiriswd-tn__navigator-drill-down', { hasText: 'Products' } )
		.click();
	await expect( navScreen( page, 'screen-0' ) ).toHaveClass( /is-active/ );

	// Close the overlay via close button.
	await page.locator( 'main .sagiriswd-tn__responsive-container-close' ).click();
	await expect(
		page.locator( 'main .sagiriswd-tn__responsive-container' )
	).not.toHaveClass( /is-menu-open/ );

	// Re-open.
	await openOverlay( page );

	// Navigator must be reset to root.
	await expect( navScreen( page, 'root' ) ).toHaveClass( /is-active/ );
	await expect( navScreen( page, 'screen-0' ) ).not.toHaveClass( /is-active/ );
} );

// ─── AC9: Desktop — navigator hidden, normal container visible, flyout works ──

test( 'AC9 — at desktop viewport navigator wrapper is hidden (display:none)', async ( { page } ) => {
	await page.setViewportSize( DESKTOP_VIEWPORT );
	await page.goto( PAGE_URL );

	// computed display must be none — CSS uses `display: none !important`.
	const navWrapperDisplay = await page.locator( 'main .sagiriswd-tn__navigator-wrapper' ).evaluate(
		( el ) => getComputedStyle( el ).display
	);
	expect( navWrapperDisplay ).toBe( 'none' );
} );

test( 'AC9 — at desktop viewport the normal inner-blocks container is visible', async ( { page } ) => {
	await page.setViewportSize( DESKTOP_VIEWPORT );
	await page.goto( PAGE_URL );

	const tnContainer = page.locator( 'main .sagiriswd-tn__container' );
	await expect( tnContainer ).toBeVisible();

	// Desktop submenu items are present and visible.
	await expect( page.locator( 'main .sagiriswd-tn-submenu' ).first() ).toBeVisible();
} );

test( 'AC9 — at desktop viewport hovering a submenu reveals its flyout container without opening the navigator', async ( { page } ) => {
	await page.setViewportSize( DESKTOP_VIEWPORT );
	await page.goto( PAGE_URL );

	const firstSubmenu = page.locator( 'main .sagiriswd-tn-submenu' ).first();
	await firstSubmenu.hover();

	// Submenu container becomes visible via CSS hover rule.
	const submenuContainer = firstSubmenu.locator( '.sagiriswd-tn__submenu-container' );
	await expect( submenuContainer ).toBeVisible();

	// Navigator wrapper remains hidden — the flyout is powered by CSS hover, not the navigator.
	const navWrapperDisplay = await page.locator( 'main .sagiriswd-tn__navigator-wrapper' ).evaluate(
		( el ) => getComputedStyle( el ).display
	);
	expect( navWrapperDisplay ).toBe( 'none' );

	// The overlay is NOT open (no is-menu-open on the responsive container).
	await expect(
		page.locator( 'main .sagiriswd-tn__responsive-container' )
	).not.toHaveClass( /is-menu-open/ );
} );

// ─── AC10: Free-tier expired — only 3 top-level submenus in HTML ──────────────

test( 'AC10 — root screen has exactly 3 top-level drill-down buttons (free-tier limit)', async ( { page } ) => {
	await gotoMobile( page );
	await openOverlay( page );

	await expect(
		navScreen( page, 'root' ).locator( '.sagiriswd-tn__navigator-drill-down' )
	).toHaveCount( 3 );
} );

test( 'AC10 — Blog and Contact are absent from navigator HTML; Products/Services/About present', async ( { page } ) => {
	// Navigator is server-rendered — check raw HTML before opening overlay.
	await gotoMobile( page );

	const html = await page.locator( 'main .sagiriswd-tn__navigator' ).innerHTML();

	// Blocked (free-tier limit = 3).
	expect( html ).not.toContain( 'Blog' );
	expect( html ).not.toContain( 'Contact' );

	// Allowed items present.
	expect( html ).toContain( 'Products' );
	expect( html ).toContain( 'Services' );
	expect( html ).toContain( 'About' );
} );
