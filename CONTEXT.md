# TesseNav — Domain Glossary

## Blocks

**TesseNav** (`sagiriswd/tessenav`)
The parent navigation block. Registered by the `tessenav` plugin. Wraps all nav items and submenus.

**TesseNav Submenu** (`sagiriswd/tessenav-submenu`)
A nav item that can contain inner blocks (other submenus, groups, paragraphs, etc.). Can be nested up to `maxNestingLevel` deep.

**Top-Level Submenu**
A `sagiriswd/tessenav-submenu` block that is a direct child of a TesseNav block (not nested inside another submenu). The free tier limit applies only to top-level submenus.

## Tiers

**Free Tier**
The baseline capability of TesseNav with only the `tessenav` plugin active. Limited to 3 top-level submenus.

**Premium Tier**
Unlocked when the `sagiris-premium-blocks` plugin is also active. Removes the submenu limit and grants access to all features.

## Plugins

**tessenav** (`tessenav/tessenav.php`)
The standalone free plugin. Self-contained — works without `sagiris-premium-blocks`. Enforces free-tier limits when premium is not detected.

**sagiris-premium-blocks** (`sagiris-premium-blocks/sagiris-premium-blocks.php`)
The license manager plugin for the Sagiris block ecosystem. Manages the Bundle License Key, runs daily validation, and writes `sagiriswd_bundle_license_status` to `wp_options`. Its presence is not required for individual TesseNav licensing but is required for bundle licensing to function.

## Tiers (continued)

**License Priority**
The order `tessenav` uses to resolve premium status: (1) read `sagiriswd_bundle_license_status` from `wp_options` — if valid, Premium Tier; (2) read `sagiriswd_tessenav_license_status` — if valid, Premium Tier; (3) Free Tier.

**TesseNav License Key**
An Individual License Key granting Premium Tier access to `tessenav` only. Entered in the Sagiris > TesseNav admin settings page. Validated daily via WP cron; result cached in `sagiriswd_tessenav_license_status`.

**Grace Period**
A 30-day window after a license subscription lapses (expiry date passes without renewal) during which the frontend continues to render all submenus regardless of count. Triggered by subscription lapse only — not by manual key removal. Calculated from the expiry timestamp in the cached license status. After expiry, the frontend silently drops top-level submenus beyond index 3. A persistent WP admin notice counts down the remaining days.

**Upgrade URL**
The external purchase/marketing URL for TesseNav Premium and `sagiris-premium-blocks`. Defined as `TESSENAV_UPGRADE_URL` in `tessenav.php` and passed to editor JS via `wp_localize_script`. Currently a placeholder.

## Mobile UX

**Navigator UX**
The mobile rendering pattern for TesseNav. On mobile: a hamburger opens an overlay; top-level nav items are shown as the initial screen; tapping a submenu item navigates forward to a new screen showing that submenu's content; a back button returns to the parent screen. Non-submenu inner block content (paragraphs, groups, etc.) renders below submenu links within the same screen.

**Navigator Screen**
One panel in the Navigator UX. Each `sagiriswd/tessenav-submenu` block maps to one Navigator Screen. The root screen contains all direct children of the TesseNav block.
