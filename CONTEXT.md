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
The premium bundle plugin. Defines the `SAGIRIS_PREMIUM_BLOCKS_VERSION` constant on init. Its presence (detected via `defined('SAGIRIS_PREMIUM_BLOCKS_VERSION')`) signals premium tier to the `tessenav` plugin.

## Tiers (continued)

**Grace Period**
A 30-day window after `sagiris-premium-blocks` is deactivated during which the frontend continues to render all submenus regardless of count. Tracked via the `tessenav_premium_deactivated_at` timestamp in `wp_options`, written by `sagiris-premium-blocks`'s deactivation hook, read by `tessenav`. After expiry, the frontend silently drops top-level submenus beyond index 3. A persistent WP admin notice counts down the remaining days.

**Upgrade URL**
The external purchase/marketing URL for `sagiris-premium-blocks`. Defined as `TESSENAV_UPGRADE_URL` in `tessenav.php` and passed to editor JS via `wp_localize_script`. Currently a placeholder.

## Mobile UX

**Navigator UX**
The mobile rendering pattern for TesseNav. On mobile: a hamburger opens an overlay; top-level nav items are shown as the initial screen; tapping a submenu item navigates forward to a new screen showing that submenu's content; a back button returns to the parent screen. Non-submenu inner block content (paragraphs, groups, etc.) renders below submenu links within the same screen.

**Navigator Screen**
One panel in the Navigator UX. Each `sagiriswd/tessenav-submenu` block maps to one Navigator Screen. The root screen contains all direct children of the TesseNav block.
