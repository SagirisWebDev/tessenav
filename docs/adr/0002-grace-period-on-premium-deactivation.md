# ADR 0002 — 30-day grace period on premium deactivation

## Status
Partially superseded — the grace period window (30 days, frontend-only, admin notice) remains. The trigger has changed: grace period now starts from license subscription expiry timestamp (returned by the license server and cached in the license status option), not from plugin deactivation. Manual key removal ends premium access immediately with no grace period. See `sagiris-premium-blocks` ADR-0002.

## Context
When `sagiris-premium-blocks` is deactivated, sites that were built with more than 3 top-level submenus would immediately have their frontend navigation broken if the submenu cap were enforced instantly. A grace period prevents this.

## Decision
- `sagiris-premium-blocks` writes `sagiriswd_premium_deactivated_at` (Unix timestamp) to `wp_options` via its deactivation hook.
- `tessenav` reads this value. If it exists and is within 30 days, premium rendering is preserved on the frontend.
- After 30 days, `tessenav` renders only the first 3 top-level submenus on the frontend.
- A persistent WP admin notice (visible to admins on all admin pages) displays the days remaining and links to the upgrade URL.
- The editor insertion gate (3-submenu cap) activates immediately on deactivation — only the frontend renderer and the admin notice use the grace period.

## Consequences
- Live sites are not broken immediately on deactivation — good for user trust.
- The logic is split: timestamp write in `sagiris-premium-blocks`, read/enforcement in `tessenav`. Both plugins must stay in sync on the `wp_options` key name.
- A user who reinstalls `sagiris-premium-blocks` during the grace period resets cleanly (the constant is present again, the timestamp is ignored).
