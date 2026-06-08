# ADR 0004 — Editor drill state derives from WP block selection

## Status
Accepted

## Context
With the editor drill-down view backed by a single inner-blocks tree (see ADR 0003), the drill state — which screen is currently visible — could be implemented as:

- Independent React state with explicit `drillTo(id)` / `back()` actions wired to dedicated UI affordances (e.g. a chevron button on each Submenu row), plus a synchronisation effect to keep it consistent with WP block selection.
- Derived from WP block selection directly: the stack is whatever Submenus appear on the path from the TesseNav block down to the currently selected block.

The first option requires reconciling two state machines whenever they would otherwise disagree — for example, when the user selects a deeply nested block via the list view, or when they delete the Submenu they are currently inside.

## Decision
The drill stack is derived from `getBlockParents(selectedClientId)`, capped at the TesseNav block's clientId, filtered to Submenus only, with the selected block itself appended when it is a Submenu. The derivation is implemented as a pure function (`deriveDrillStack`). A `useSelect` calls it; a `useState` persists the last non-null result. A `useEffect` updates the persisted stack only when the derivation returns non-null — selecting an unrelated block outside the TesseNav tree preserves the last drill state rather than resetting it.

The chevron-as-separate-click-target affordance is dropped. Clicking a Submenu's row in drill-down mode invokes normal WP block selection; the derivation picks the new selection up; the stack updates as a consequence. The chevron remains as a purely decorative affordance to signal "this row is drillable."

The Back button calls `selectBlock(parentSubmenu ?? tessenavClientId)`. The derivation then pops the stack.

## Consequences
- One state machine instead of two. Click handlers do not coordinate selection and drill — selection IS drill.
- The `setTimeout(selectBlock, 0)` deferral the old Navigator-based code needed (to avoid WP's block-selection reconciler racing with Navigator's `goTo()`) becomes unnecessary.
- Self-healing on deleted Submenus: when WP reassigns selection upward after a delete, the derivation recomputes and the stack shrinks. No manual stale-clientId cleanup.
- Selecting a block deep inside a nested non-Submenu container (e.g. a paragraph inside a row inside a Submenu) drills the overlay to the containing Submenu automatically — the author's spatial context follows their focus.
- Selecting a block outside the TesseNav tree preserves drill state — authors do not lose their place when they check on the Document panel or another block.
- Limitation: any UX that would require drill state to differ from selection (e.g. "stay at this screen while I inspect a different block's attributes") is not supported. This is an accepted trade-off; the scenario has not surfaced in real authoring flows.
- The pure-function derivation can be unit-tested across all selection edge cases without React, DOM, or block-editor scaffolding.
