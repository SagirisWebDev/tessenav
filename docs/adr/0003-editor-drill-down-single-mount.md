# ADR 0003 — Editor drill-down via single InnerBlocks mount + CSS, not Navigator

## Status
Accepted

## Context
The block editor's mobile preview of the Navigator UX needs to be fully interactive — authors must be able to select blocks accurately, inline-edit rich text, and use the block toolbar inside the drill-down view. The natural choice was `__experimentalNavigatorProvider` / `NavigatorScreen` / `NavigatorButton` from `@wordpress/components`, which the previous implementation used to render a read-only preview. But `NavigatorScreen` conditionally renders its children based on the active path: when the user drills out of a screen, that screen is unmounted from the DOM. WP's block editor requires `useInnerBlocksProps` to mount each block's tree exactly once and keep it mounted — unmounting destroys focus, in-progress rich-text edits, and selection state. Two parallel mounts of the same clientId are also disallowed. These constraints make Navigator's conditional rendering incompatible with a single canonical InnerBlocks tree.

## Decision
Drop `__experimentalNavigatorProvider` from the editor preview entirely. Mount the editable inner-blocks tree exactly once, inside the `ResponsiveWrapper`. Express "which screen is currently visible" as CSS-driven visibility over the same DOM:

- TesseNav holds a drill stack (an ordered list of Submenu clientIds) exposed through a `TesseNavDrillContext`.
- TesseNav Submenu consumes the context and adds `is-on-active-path` / `is-active-screen` classes to its own wrapper via its existing className builder.
- CSS rules scoped to `.sagiriswd-tn__responsive-container.is-menu-open` use those classes to hide off-path siblings and reveal the active screen's children.

A small chrome component (Back button + active Submenu label) is rendered above the inner-blocks div as editor-only UI, conditional on the overlay being open and the stack being non-empty.

## Consequences
- Real WP InnerBlocks behaviour — block toolbar, inline rich-text editing, accurate selection — is available inside the drill-down view because there are no `BlockPreview` clones in the way.
- The row-vs-paragraph click bug (clicking a paragraph nested in a row selected the row) disappears by construction: the only thing the click hits is the real block.
- Authors editing on desktop canvas can open the overlay to preview and edit the mobile UX; the same DOM serves both layouts.
- CSS visibility rules must be maintained carefully — they encode a rendering contract that was previously expressed in JS. A contributor adding a new block type to the allowed inner-blocks list may need to update the visibility rules to handle it.
- Drag-and-drop reorder inside a drill-down screen and the "+" appender inside a screen are explicitly not supported in v1 — they conflict with the visibility-by-CSS approach. Authors can still perform these operations from the inline desktop layout.
- The frontend Navigator UX (PHP + view.js) is unaffected — it has always used custom rendering, not the WP components.
