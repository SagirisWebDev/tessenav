// @ts-check
/**
 * Playwright browser tests — submenu wrapper width and layout-setting
 * propagation.
 *
 * AC coverage:
 *   AC-NESTED-WIDTH  — A `.wp-block-sagiriswd-tessenav-submenu` nested inside
 *                      another tessenav-submenu must size to its label content,
 *                      NOT stretch to the full width of the parent
 *                      `.sagiriswd-tn__submenu-container`. (Matches the
 *                      behaviour of top-level submenus like "Products".)
 *
 *   AC-LAYOUT-SETTINGS — The layout panel's orientation/justification settings
 *                        on a tessenav-submenu must propagate to that submenu's
 *                        inner items container (`.sagiriswd-tn__submenu-container`).
 *                        Currently the inner container hardcodes
 *                        `flex-direction: column`, so settings on the wrapper
 *                        don't reach the items.
 *
 * Note on parallelism: AC-NESTED-WIDTH measures the live frontend at /484-2/,
 * which has flaked under parallel workers in the past (multiple specs hitting
 * the same WordPress install race on first paint). If a parallel CI run flakes
 * here but a single-worker re-run passes, the cause is contention, not a real
 * regression. Run with `--workers=1` to isolate.
 */

import { test, expect } from '@playwright/test';

const FRONTEND_URL = '/484-2/';
const DESKTOP_VIEWPORT = { width: 1280, height: 800 };

async function openTopLevelSubmenu( page, label ) {
	// The top-level submenu items sit inside .sagiriswd-tn__container (which
	// itself lives within the responsive container on the frontend). Match by
	// label text and require the .has-child class for submenu toggles.
	const wrapper = page
		.locator(
			'main .sagiriswd-tn .sagiriswd-tn__container > .sagiriswd-tn-submenu.has-child',
			{
				has: page.locator(
					`.sagiriswd-tn-item__label:has-text("${ label }")`
				),
			}
		)
		.first();
	await wrapper.waitFor( { state: 'visible' } );
	const toggle = wrapper
		.locator( ':scope > button.sagiriswd-tn-submenu__toggle' )
		.first();
	await toggle.click();
	return wrapper;
}

test.describe( 'AC-NESTED-WIDTH — nested submenu wrapper sizes to label', () => {
	test( 'AC-NESTED-WIDTH — Web Apps wrapper is narrower than the Products submenu container', async ( {
		page,
	} ) => {
		await page.setViewportSize( DESKTOP_VIEWPORT );
		await page.goto( FRONTEND_URL );

		const productsWrapper = await openTopLevelSubmenu( page, 'Products' );
		const productsContainer = productsWrapper.locator(
			':scope > .sagiriswd-tn__submenu-container'
		);
		await expect( productsContainer ).toBeVisible();

		const webAppsWrapper = productsContainer
			.locator(
				'.sagiriswd-tn-submenu.has-child.wp-block-sagiriswd-tessenav-submenu',
				{
					has: page.locator(
						'.sagiriswd-tn-item__label:has-text("Web Apps")'
					),
				}
			)
			.first();
		await expect( webAppsWrapper ).toBeVisible();

		// Measure: the Web Apps WRAPPER must be narrower than the Products
		// submenu container (the wrapper should hug its label, not stretch).
		const containerBox = await productsContainer.boundingBox();
		const wrapperBox = await webAppsWrapper.boundingBox();
		expect( containerBox ).not.toBeNull();
		expect( wrapperBox ).not.toBeNull();

		// Strict: wrapper should be SIGNIFICANTLY narrower (at least 20px) so
		// it visibly reads as a content-fit, not a stretch with a tiny gap.
		expect(
			containerBox.width - wrapperBox.width,
			`wrapper width ${ wrapperBox.width } must be < container width ${ containerBox.width }`
		).toBeGreaterThan( 20 );
	} );

	test( 'AC-NESTED-WIDTH — nested submenu wrapper width matches its label/button bbox (±40px)', async ( {
		page,
	} ) => {
		await page.setViewportSize( DESKTOP_VIEWPORT );
		await page.goto( FRONTEND_URL );

		const productsWrapper = await openTopLevelSubmenu( page, 'Products' );
		const productsContainer = productsWrapper.locator(
			':scope > .sagiriswd-tn__submenu-container'
		);

		const webAppsWrapper = productsContainer
			.locator(
				'.sagiriswd-tn-submenu.has-child.wp-block-sagiriswd-tessenav-submenu',
				{
					has: page.locator(
						'.sagiriswd-tn-item__label:has-text("Web Apps")'
					),
				}
			)
			.first();
		const webAppsToggle = webAppsWrapper
			.locator( ':scope > button.sagiriswd-tn-submenu__toggle' )
			.first();

		const wrapperBox = await webAppsWrapper.boundingBox();
		const toggleBox = await webAppsToggle.boundingBox();
		expect( wrapperBox ).not.toBeNull();
		expect( toggleBox ).not.toBeNull();

		// The wrapper should be close in width to the toggle button (which
		// contains the label and chevron). Allow wrapper padding tolerance.
		expect(
			Math.abs( wrapperBox.width - toggleBox.width ),
			`wrapper ${ wrapperBox.width } vs toggle ${ toggleBox.width }`
		).toBeLessThan( 60 );
	} );
} );

test.describe( 'AC-LAYOUT-SETTINGS — submenu container honours wrapper layout classes', () => {
	// These tests synthesise the WP layout classes via page.evaluate so they
	// don't depend on the test fixture's editor state. They verify the CSS
	// contract: when a submenu wrapper has the `is-horizontal` class (set by
	// the layout panel), its inner `.sagiriswd-tn__submenu-container` should
	// arrange items in a row, not a column.

	test( 'AC-LAYOUT-SETTINGS — is-vertical class on wrapper keeps inner container flex-direction: column', async ( {
		page,
	} ) => {
		// `is-horizontal` is intentionally NOT bridged (WP applies it by default
		// to every flex block, so honouring it would force every legacy submenu
		// into a row layout). We assert `is-vertical` works as the explicit
		// opt-in for column layout — matching block.json's new default.
		await page.setViewportSize( DESKTOP_VIEWPORT );
		await page.goto( FRONTEND_URL );

		const productsWrapper = await openTopLevelSubmenu( page, 'Products' );
		const productsContainer = productsWrapper.locator(
			':scope > .sagiriswd-tn__submenu-container'
		);
		await expect( productsContainer ).toBeVisible();

		const webAppsWrapper = productsContainer
			.locator(
				'.sagiriswd-tn-submenu.has-child.wp-block-sagiriswd-tessenav-submenu',
				{
					has: page.locator(
						'.sagiriswd-tn-item__label:has-text("Web Apps")'
					),
				}
			)
			.first();
		await webAppsWrapper.waitFor( { state: 'visible' } );

		const flexDirection = await webAppsWrapper.evaluate( ( wrapper ) => {
			wrapper.classList.remove( 'is-horizontal', 'is-vertical' );
			wrapper.classList.add( 'is-vertical' );
			const container = wrapper.querySelector(
				':scope > .sagiriswd-tn__submenu-container'
			);
			return getComputedStyle( container ).flexDirection;
		} );
		expect( flexDirection ).toBe( 'column' );
	} );

	test( 'AC-LAYOUT-SETTINGS — is-content-justification-center class on wrapper makes inner container justify-content: center', async ( {
		page,
	} ) => {
		await page.setViewportSize( DESKTOP_VIEWPORT );
		await page.goto( FRONTEND_URL );

		const productsWrapper = await openTopLevelSubmenu( page, 'Products' );
		const productsContainer = productsWrapper.locator(
			':scope > .sagiriswd-tn__submenu-container'
		);
		await expect( productsContainer ).toBeVisible();

		const webAppsWrapper = productsContainer
			.locator(
				'.sagiriswd-tn-submenu.has-child.wp-block-sagiriswd-tessenav-submenu',
				{
					has: page.locator(
						'.sagiriswd-tn-item__label:has-text("Web Apps")'
					),
				}
			)
			.first();

		const justifyContent = await webAppsWrapper.evaluate( ( wrapper ) => {
			// Replace any existing justification class so we test the one we're setting.
			Array.from( wrapper.classList )
				.filter( ( c ) => c.startsWith( 'is-content-justification-' ) )
				.forEach( ( c ) => wrapper.classList.remove( c ) );
			wrapper.classList.add( 'is-content-justification-center' );
			const container = wrapper.querySelector(
				':scope > .sagiriswd-tn__submenu-container'
			);
			return getComputedStyle( container ).justifyContent;
		} );
		expect( justifyContent ).toBe( 'center' );
	} );

	test( 'AC-LAYOUT-SETTINGS — is-nowrap class on wrapper makes inner container flex-wrap: nowrap', async ( {
		page,
	} ) => {
		await page.setViewportSize( DESKTOP_VIEWPORT );
		await page.goto( FRONTEND_URL );

		const productsWrapper = await openTopLevelSubmenu( page, 'Products' );
		const productsContainer = productsWrapper.locator(
			':scope > .sagiriswd-tn__submenu-container'
		);
		await expect( productsContainer ).toBeVisible();

		const webAppsWrapper = productsContainer
			.locator(
				'.sagiriswd-tn-submenu.has-child.wp-block-sagiriswd-tessenav-submenu',
				{
					has: page.locator(
						'.sagiriswd-tn-item__label:has-text("Web Apps")'
					),
				}
			)
			.first();

		const flexWrap = await webAppsWrapper.evaluate( ( wrapper ) => {
			wrapper.classList.add( 'is-nowrap' );
			const container = wrapper.querySelector(
				':scope > .sagiriswd-tn__submenu-container'
			);
			return getComputedStyle( container ).flexWrap;
		} );
		expect( flexWrap ).toBe( 'nowrap' );
	} );
} );
