=== Mega Menu for Navigation Block — TesseNav ===
Contributors:      sagirisdev
Tags:              navigation, menu, mega-menu, submenus, drill-down
Requires at least: 6.7
Tested up to:      7.0
Requires PHP:      7.4
Stable tag:        0.1.0
License:           GPL-2.0-or-later
License URI:       https://www.gnu.org/licenses/gpl-2.0.html

Build navigation with rich submenus — text, media, columns, and any layout block inside the WordPress Navigation block.

== Description ==

TesseNav extends the core Navigation block with a Submenu block that can hold any other block: paragraphs, headings, images, columns, groups, lists, buttons — anything in your block library. Build mega-menus, product showcases, contact panels, or simple grouped links, all directly inside the Site Editor.

= Core capabilities (free) =

* **Rich submenus.** Drop any block inside a TesseNav Submenu — text, media, columns, groups, buttons, lists. Submenus are full layout surfaces, not just link lists.
* **Drill-down navigator for mobile.** When viewport shrinks below your chosen breakpoint, submenus collapse into a smooth screen-by-screen drill-down overlay with back navigation. No third-party scripts.
* **Built for accessibility.** Keyboard navigation, focus management, screen-reader-friendly landmarks, ARIA-correct expand/collapse state. The drill-down overlay manages focus traps and `aria-hidden` automatically.
* **First three top-level submenus per Navigation block** render on the live site. Editor preview shows the full structure you've built so you can plan and design without limits.
* **No calls home.** TesseNav never contacts an external server unless you activate a Premium license key. No telemetry, no tracking, no analytics pings.

= TesseNav Premium =

Premium unlocks unlimited top-level submenus per Navigation block, plus future Premium-only features and direct email support. License keys are validated against Lemon Squeezy. See the Upgrade link inside the editor for current pricing.

= Built for the Site Editor =

TesseNav is a block-editor plugin. It requires WordPress 6.7+ and works with any block theme. It does not modify the classic Navigation Menus admin screen.

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/tessenav` directory, or install through the WordPress plugins screen.
2. Activate the plugin through the **Plugins** screen in WordPress.
3. Edit any page or template, insert a **Navigation** block, then insert a **TesseNav Submenu** inside it.
4. Add any blocks you like inside the submenu — paragraphs, images, columns, anything.

For TesseNav Premium activation:

1. Purchase a license key (Upgrade link in the editor or your Lemon Squeezy email).
2. In WordPress, go to **Settings → TesseNav** (or **Sagiris Premium Blocks → TesseNav** if the parent menu is installed).
3. Paste your license key and click **Activate**.

== Frequently Asked Questions ==

= Does TesseNav work with my theme? =

TesseNav works with any block theme (FSE-compatible). Classic themes that don't support the core Navigation block won't render TesseNav submenus on the frontend, though the editor still works.

= Does TesseNav work with classic WordPress menus? =

No. TesseNav extends the core **Navigation block**, not the legacy **Appearance → Menus** screen. If your site uses classic menus, the easiest path is to add a Navigation block to your header template and rebuild your menu there.

= What's the difference between free and Premium? =

Free tier renders the first three top-level submenus per Navigation block on the live site. You can still add and edit more submenus in the editor — TesseNav shows you exactly what's gated and provides an upgrade path inline. Premium unlocks unlimited top-level submenus per Navigation block, plus future Premium-only features.

= Does TesseNav collect any data? =

No. The free tier makes zero external network requests. Premium activation contacts the Lemon Squeezy license API only after you paste a license key — no pings, no telemetry, no analytics.

= Can I use the same Premium license on multiple sites? =

License activation policy is set per product variant in Lemon Squeezy. Check your purchase confirmation or the Premium license page for activation limits.

= Where do I get support? =

Free tier: post in the plugin support forum on WordPress.org. Premium: email <tiegan@sagirisdev.com> for direct support.

= Is TesseNav GPL-licensed? =

Yes, GPL-2.0-or-later. All PHP, JavaScript, CSS, and bundled assets are GPL-compatible.

== Screenshots ==

1. Outdoor gear mega menu — a Shop submenu opens to a four-column layout with product photography, category headings, and a sale call-to-action.
2. SaaS product matrix — a Products submenu opens to a four-card grid: each card has a heading, tagline, and "Learn more" link.
3. Restaurant mini-page submenu — a Menu submenu opens as a two-column layout combining a food list with prices, a dish photo, and a reservation button.
4. Mobile drill-down navigator — on small viewports, submenus collapse into a screen-by-screen drill-down overlay with focus-managed transitions and back navigation.
5. Editor assembly — a TesseNav Submenu opened mid-build in the Site Editor, showing Columns, Image, and Heading blocks dropped directly inside.

== Changelog ==

= 0.1.0 =

Initial release.

* Navigation block extension with TesseNav Submenu allowing any inner blocks.
* Drill-down navigator for mobile breakpoints.
* Free-tier rendering of the first three top-level submenus per Navigation block.
* Premium license activation via Lemon Squeezy.
* Block-editor upsell card with screen-reader announcement on gated submenus.
* Accessibility: focus traps in the mobile overlay, ARIA expanded/collapsed state on submenu toggles.

== Upgrade Notice ==

= 0.1.0 =

Initial release of TesseNav.
