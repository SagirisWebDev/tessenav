# ADR 0001 — Freemium detection via plugin-presence constant

## Status
Superseded by `sagiris-premium-blocks` ADR-0002 (license key detection model)

## Context
TesseNav needs to enforce a 3-top-level-submenu limit for free users and remove it for premium users. Several detection mechanisms were considered: Freemius SDK, custom license keys, plugin presence check.

## Decision
Premium status is detected by checking `defined('SAGIRIS_PREMIUM_BLOCKS_VERSION')` in PHP. The `sagiris-premium-blocks` plugin defines this constant on init. The result is passed to the block editor JS via `wp_localize_script`. No license keys, no external API calls.

## Consequences
- No external SDK or license server dependency — simpler to maintain and audit.
- Plugin presence is a sufficient proxy for "paid" because `sagiris-premium-blocks` is a paid plugin distributed outside WP.org.
- If Freemius is adopted later, only the PHP detection and JS payload need to change — the JS enforcement logic and UI are decoupled from the detection mechanism.
- Caveat: a user who installs `sagiris-premium-blocks` without paying (e.g. from a cracked copy) would bypass the limit. This is an accepted trade-off at this stage.
