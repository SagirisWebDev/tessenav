# Submenu layouts test page

Manual visual QA fixture for tessenav submenus populated with realistic container blocks (Group / Row / Columns / Grid) and a representative payload of content blocks (Heading, Paragraph, Button, Details, Table, List, Icon, Image, Embed, Query Loop, Avatar).

The matrix is organized by **container type** (one top-level submenu per container). Each fixture includes a **sibling nested submenu** alongside the container. The **Grid fixture also doubles as the container-in-container case** (each grid cell is a `core/group` card).

Run three passes per fixture: desktop dropdown (1280px), mobile navigator (390px), editor canvas. See acceptance bullets below.

---

## Build steps

1. WP Admin → Pages → Add New. Title: "Submenu Layouts Test". Slug: `submenu-layouts-test`. Template: default theme template.
2. In the editor, open the options menu (`⋮`) → "Code editor".
3. Paste the markup block below into the code editor area, replacing whatever is there.
4. Click "Exit code editor" to return to the visual editor.
5. Walk through every `[FILL: ...]` placeholder and fill it in via the block UI:
   - Paragraph placeholders → replace text
   - Heading placeholders → replace text
   - Image blocks → upload/select from media library
   - Icon blocks → pick an icon from the library
   - Embed block → paste a real YouTube URL
   - Query Loop → set query to 2 most recent posts, confirm Avatar appears in the post template
   - List items → set link URLs (can be `#` for QA)
   - Table cells → fill in (3 rows × 3 cols: Year/Team/Locations etc.)
   - Details summary → already populated, fill in interior paragraphs
   - Sub-submenu link URLs → can be `#` for QA
6. Save → Publish.

---

## Block markup

```html
<!-- wp:spacer {"height":"120px"} -->
<div style="height:120px" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:sagiriswd/tessenav {"layout":{"type":"flex"}} -->

  <!-- wp:sagiriswd/tessenav-submenu {"label":"About","menuMaxWidth":"600px"} -->

    <!-- wp:group {"layout":{"type":"constrained"}} -->
    <div class="wp-block-group">

      <!-- wp:heading {"level":3} -->
      <h3 class="wp-block-heading">Who we are</h3>
      <!-- /wp:heading -->

      <!-- wp:paragraph -->
      <p>[FILL: 2 sentences of real-length company copy. About 30 words.]</p>
      <!-- /wp:paragraph -->

      <!-- wp:paragraph -->
      <p>[FILL: 2 more sentences continuing the company story. About 30 words.]</p>
      <!-- /wp:paragraph -->

      <!-- wp:details -->
      <details class="wp-block-details">
        <summary>Our mission</summary>
        <!-- wp:paragraph -->
        <p>[FILL: 2 sentences expanding on mission. About 30 words.]</p>
        <!-- /wp:paragraph -->

        <!-- wp:paragraph -->
        <p>[FILL: 1 closing sentence. About 15 words.]</p>
        <!-- /wp:paragraph -->
      </details>
      <!-- /wp:details -->

      <!-- wp:table -->
      <figure class="wp-block-table"><table><thead><tr><th>Founded</th><th>Team</th><th>Locations</th></tr></thead><tbody><tr><td>[FILL: year]</td><td>[FILL: count]</td><td>[FILL: city / city]</td></tr></tbody></table></figure>
      <!-- /wp:table -->

      <!-- wp:heading {"level":4} -->
      <h4 class="wp-block-heading">Latest from the blog</h4>
      <!-- /wp:heading -->

      <!-- wp:query {"queryId":1,"query":{"perPage":2,"pages":0,"offset":0,"postType":"post","order":"desc","orderBy":"date","author":"","search":"","exclude":[],"sticky":"","inherit":false}} -->
      <div class="wp-block-query">
        <!-- wp:post-template -->
          <!-- wp:avatar {"size":40} /-->
          <!-- wp:post-title {"isLink":true} /-->
          <!-- wp:post-excerpt {"moreText":""} /-->
        <!-- /wp:post-template -->
      </div>
      <!-- /wp:query -->

      <!-- wp:buttons -->
      <div class="wp-block-buttons">
        <!-- wp:button -->
        <div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="#">Learn more</a></div>
        <!-- /wp:button -->
      </div>
      <!-- /wp:buttons -->

    </div>
    <!-- /wp:group -->

    <!-- wp:sagiriswd/tessenav-submenu {"label":"Company","kind":"custom","url":"#"} -->
      <!-- wp:sagiriswd/tessenav-submenu {"label":"Team","kind":"custom","url":"#"} /-->
      <!-- wp:sagiriswd/tessenav-submenu {"label":"Careers","kind":"custom","url":"#"} /-->
    <!-- /wp:sagiriswd/tessenav-submenu -->

  <!-- /wp:sagiriswd/tessenav-submenu -->


  <!-- wp:sagiriswd/tessenav-submenu {"label":"Solutions","menuMaxWidth":"500px"} -->

    <!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"space-between"}} -->
    <div class="wp-block-group">

      <!-- wp:icon /-->
      <!-- wp:heading {"level":4} -->
      <h4 class="wp-block-heading">Startups</h4>
      <!-- /wp:heading -->

      <!-- wp:icon /-->
      <!-- wp:heading {"level":4} -->
      <h4 class="wp-block-heading">Enterprise</h4>
      <!-- /wp:heading -->

      <!-- wp:icon /-->
      <!-- wp:heading {"level":4} -->
      <h4 class="wp-block-heading">Agencies</h4>
      <!-- /wp:heading -->

      <!-- wp:icon /-->
      <!-- wp:heading {"level":4} -->
      <h4 class="wp-block-heading">Nonprofits</h4>
      <!-- /wp:heading -->

    </div>
    <!-- /wp:group -->

    <!-- wp:sagiriswd/tessenav-submenu {"label":"More","kind":"custom","url":"#"} -->
      <!-- wp:sagiriswd/tessenav-submenu {"label":"Use cases","kind":"custom","url":"#"} /-->
      <!-- wp:sagiriswd/tessenav-submenu {"label":"Customers","kind":"custom","url":"#"} /-->
    <!-- /wp:sagiriswd/tessenav-submenu -->

  <!-- /wp:sagiriswd/tessenav-submenu -->


  <!-- wp:sagiriswd/tessenav-submenu {"label":"Products","menuMaxWidth":"700px"} -->

    <!-- wp:columns {"isStackedOnMobile":true} -->
    <div class="wp-block-columns">

      <!-- wp:column -->
      <div class="wp-block-column">
        <!-- wp:heading {"level":4} -->
        <h4 class="wp-block-heading">Web</h4>
        <!-- /wp:heading -->

        <!-- wp:list -->
        <ul class="wp-block-list">
          <!-- wp:list-item --><li><a href="#">[FILL: link]</a></li><!-- /wp:list-item -->
          <!-- wp:list-item --><li><a href="#">[FILL: link]</a></li><!-- /wp:list-item -->
          <!-- wp:list-item --><li><a href="#">[FILL: link]</a></li><!-- /wp:list-item -->
          <!-- wp:list-item --><li><a href="#">[FILL: link]</a></li><!-- /wp:list-item -->
        </ul>
        <!-- /wp:list -->

        <!-- wp:paragraph -->
        <p><a href="#">View pricing →</a></p>
        <!-- /wp:paragraph -->
      </div>
      <!-- /wp:column -->

      <!-- wp:column -->
      <div class="wp-block-column">
        <!-- wp:heading {"level":4} -->
        <h4 class="wp-block-heading">Mobile</h4>
        <!-- /wp:heading -->

        <!-- wp:list -->
        <ul class="wp-block-list">
          <!-- wp:list-item --><li><a href="#">[FILL: link]</a></li><!-- /wp:list-item -->
          <!-- wp:list-item --><li><a href="#">[FILL: link]</a></li><!-- /wp:list-item -->
          <!-- wp:list-item --><li><a href="#">[FILL: link]</a></li><!-- /wp:list-item -->
          <!-- wp:list-item --><li><a href="#">[FILL: link]</a></li><!-- /wp:list-item -->
        </ul>
        <!-- /wp:list -->

        <!-- wp:paragraph -->
        <p><a href="#">View pricing →</a></p>
        <!-- /wp:paragraph -->
      </div>
      <!-- /wp:column -->

      <!-- wp:column -->
      <div class="wp-block-column">
        <!-- wp:heading {"level":4} -->
        <h4 class="wp-block-heading">Cloud</h4>
        <!-- /wp:heading -->

        <!-- wp:list -->
        <ul class="wp-block-list">
          <!-- wp:list-item --><li><a href="#">[FILL: link]</a></li><!-- /wp:list-item -->
          <!-- wp:list-item --><li><a href="#">[FILL: link]</a></li><!-- /wp:list-item -->
          <!-- wp:list-item --><li><a href="#">[FILL: link]</a></li><!-- /wp:list-item -->
          <!-- wp:list-item --><li><a href="#">[FILL: link]</a></li><!-- /wp:list-item -->
        </ul>
        <!-- /wp:list -->

        <!-- wp:paragraph -->
        <p><a href="#">View pricing →</a></p>
        <!-- /wp:paragraph -->
      </div>
      <!-- /wp:column -->

    </div>
    <!-- /wp:columns -->

    <!-- wp:sagiriswd/tessenav-submenu {"label":"All products","kind":"custom","url":"#"} -->
      <!-- wp:sagiriswd/tessenav-submenu {"label":"Compare","kind":"custom","url":"#"} /-->
      <!-- wp:sagiriswd/tessenav-submenu {"label":"Demos","kind":"custom","url":"#"} /-->
    <!-- /wp:sagiriswd/tessenav-submenu -->

  <!-- /wp:sagiriswd/tessenav-submenu -->


  <!-- wp:sagiriswd/tessenav-submenu {"label":"Resources","menuMaxWidth":"700px"} -->

    <!-- wp:group {"layout":{"type":"grid","minimumColumnWidth":"220px"}} -->
    <div class="wp-block-group">

      <!-- wp:group {"layout":{"type":"constrained"}} -->
      <div class="wp-block-group">
        <!-- wp:image /-->
        <!-- wp:heading {"level":5} -->
        <h5 class="wp-block-heading">Docs</h5>
        <!-- /wp:heading -->
        <!-- wp:paragraph -->
        <p>[FILL: 1 sentence describing Docs. About 12 words.]</p>
        <!-- /wp:paragraph -->
      </div>
      <!-- /wp:group -->

      <!-- wp:group {"layout":{"type":"constrained"}} -->
      <div class="wp-block-group">
        <!-- wp:icon /-->
        <!-- wp:heading {"level":5} -->
        <h5 class="wp-block-heading">Tutorials</h5>
        <!-- /wp:heading -->
        <!-- wp:paragraph -->
        <p>[FILL: 1 sentence describing Tutorials. About 12 words.]</p>
        <!-- /wp:paragraph -->
      </div>
      <!-- /wp:group -->

      <!-- wp:group {"layout":{"type":"constrained"}} -->
      <div class="wp-block-group">
        <!-- wp:image /-->
        <!-- wp:heading {"level":5} -->
        <h5 class="wp-block-heading">Blog</h5>
        <!-- /wp:heading -->
        <!-- wp:paragraph -->
        <p>[FILL: 1 sentence describing Blog. About 12 words.]</p>
        <!-- /wp:paragraph -->
      </div>
      <!-- /wp:group -->

      <!-- wp:group {"layout":{"type":"constrained"}} -->
      <div class="wp-block-group">
        <!-- wp:embed {"providerNameSlug":"youtube","responsive":true,"className":"wp-embed-aspect-16-9 wp-has-aspect-ratio"} /-->
        <!-- wp:heading {"level":5} -->
        <h5 class="wp-block-heading">Changelog</h5>
        <!-- /wp:heading -->
        <!-- wp:paragraph -->
        <p>[FILL: 1 sentence describing Changelog. About 12 words.]</p>
        <!-- /wp:paragraph -->
      </div>
      <!-- /wp:group -->

    </div>
    <!-- /wp:group -->

    <!-- wp:sagiriswd/tessenav-submenu {"label":"Browse all","kind":"custom","url":"#"} -->
      <!-- wp:sagiriswd/tessenav-submenu {"label":"By topic","kind":"custom","url":"#"} /-->
      <!-- wp:sagiriswd/tessenav-submenu {"label":"By format","kind":"custom","url":"#"} /-->
    <!-- /wp:sagiriswd/tessenav-submenu -->

  <!-- /wp:sagiriswd/tessenav-submenu -->

<!-- /wp:sagiriswd/tessenav -->
```

---

## QA acceptance bullets

For each fixture, run three passes. Pass = all bullets hold true. A failure = file a bug with screenshot.

### Fixture 1 — Group / About

**Desktop dropdown (1280px)**
- Flyout opens below "About" and is no wider than the configured `menuMaxWidth` (600px); content within wraps to that width, not the viewport.
- Heading, paragraphs, and Details summary all align to the same left edge inside the Group's padding.
- Details `<summary>` is clickable; expanding does not push the flyout off-screen or break sibling block alignment.
- Table renders fully inside the flyout without horizontal scroll. If the cell content is wide, columns compress proportionally.
- Query Loop renders the configured 2 posts in vertical order. Avatar appears to the left of (or above) each title, sized consistently.
- "Learn more" button sizes to its label and sits flush-left under the Query Loop.
- Sibling "Company" submenu sits below the Group, sized to its label (not stretched to flyout width).

**Mobile navigator (390px)**
- Drilling into "About" shows a navigator screen with all the same blocks rendered top-to-bottom.
- Zero horizontal scroll on the navigator screen, including for the Table — table either wraps cells or scrolls *within its own block*, not the navigator.
- Details expansion works inside the navigator and pushes content downward without breaking the scroll container.
- Query Loop avatars render at a size that doesn't blow out the row width.
- Embed (if added to Query post excerpt or anywhere else) maintains aspect ratio without h-scroll.

**Editor canvas**
- All blocks visible and selectable in the visual editor.
- Switching to mobile preview (editor viewport toggle) shows the navigator-style layout matching the frontend.
- No console errors when blocks are inserted/selected.

---

### Fixture 2 — Row / Solutions

**Desktop dropdown (1280px)**
- Flyout opens; the inner Row container renders the 4 Icon+Heading pairs horizontally in a single line (because `is-nowrap`).
- With `justifyContent: space-between` set, the four pairs distribute across the full Row width with the first pair flush-left and the last pair flush-right.
- Icon and adjacent Heading remain visually grouped (no drift between them — if they drift, the Row needs Icon+Heading wrapped in a Group each; flag this).
- No horizontal scroll inside the flyout at 1280px.
- Sibling "More" submenu sits below the Row.

**Mobile navigator (390px)**
- Navigator screen renders the 4 Icon+Heading pairs. Because the navigator should override `is-nowrap` and force wrapping, pairs either stack vertically or reflow to fit width.
- Zero horizontal scroll on the navigator screen — this is the critical assertion for this fixture (it's the nowrap-must-be-overridden-on-mobile contract).
- All 4 items remain visible and reachable.

**Editor canvas**
- Row renders horizontally in the editor at desktop width. Nowrap visible — items don't wrap even when adjusted.
- Mobile preview shows wrapped/stacked layout matching frontend.

---

### Fixture 3 — Columns / Products

**Desktop dropdown (1280px)**
- Flyout opens at ~700px wide; the 3 columns render side-by-side, equal width, with the configured column gap visible between them.
- Each column shows: Heading at top, List of 4 bulleted links below, "View pricing →" paragraph at bottom — vertically aligned and consistent across all 3 columns.
- List items remain on single lines (no awkward two-line link wraps) at the column's width.
- Sibling "All products" submenu sits below the Columns block.

**Mobile navigator (390px)**
- `isStackedOnMobile: true` triggers: the 3 columns collapse to single-column vertical order.
- Each column section is preceded by its Heading and shows the full list + pricing link below.
- Zero horizontal scroll.
- Reading order in stacked mode matches expected (Web → Mobile → Cloud).

**Editor canvas**
- 3 columns render side-by-side in the editor at desktop width.
- Mobile preview shows stacked layout.
- Inserting/removing list items doesn't break column alignment.

---

### Fixture 4 — Grid / Resources *(also container-in-container)*

**Desktop dropdown (1280px)**
- Flyout opens at ~700px wide; Grid auto-fit at 220px min column width yields ~3 columns visible (one row of 3 + a wrapped 4th item, or 4 in a row if width permits).
- Each card (Group inside Grid cell):
  - Card 1: Image + Heading "Docs" + Paragraph, stacked vertically inside the card.
  - Card 2: Icon + Heading "Tutorials" + Paragraph.
  - Card 3: Image + Heading "Blog" + Paragraph.
  - Card 4: Embed (YouTube iframe at 16:9) + Heading "Changelog" + Paragraph.
- Image-headed and Icon-headed cards visually align — heading baseline shouldn't jump between cards just because one has an icon and another has an image.
- Embed iframe is responsive: it fits inside the card's column width without overflowing.
- Card paragraphs wrap inside the card's column width — no horizontal scroll inside any card.
- Sibling "Browse all" submenu sits below the Grid.

**Mobile navigator (390px)**
- Grid auto-fit reflows to 1 column (since 220px min ≈ navigator screen width minus padding).
- All 4 cards stack vertically in source order.
- Embed maintains 16:9 aspect ratio without horizontal scroll.
- Zero horizontal scroll on the navigator screen.

**Editor canvas**
- Grid renders with the expected column count at desktop width in editor.
- Card content visible per cell. Mixed image/icon/embed headers don't break grid cell alignment.
- Mobile preview shows reflowed single column.

---

## Notes

- **Drilling into nested submenus (Team/Careers, Use cases/Customers, etc.):** these are leaf submenus and render as links only — the QA pass for these is just "the link is clickable and the label renders." Not separately listed in acceptance bullets.
- **`menuMaxWidth` values** chosen as a starting point. Adjust if the content overflows or sits cramped — that itself is a QA finding.
- **Failure modes to specifically watch for** (informed by existing Playwright specs):
  - Sibling nested submenu wrapper stretching to flyout width instead of hugging its label (`submenu-width-and-layout.spec.js` covers this case for Web Apps; the matrix exercises it under 4 different parent contexts).
  - Layout settings on the inner container (Row/Grid/etc.) not propagating to the container's child layout — visible as items not respecting `justify-content` or `flex-wrap`.
  - Mobile navigator content overflowing horizontally — most likely on the Table (Group fixture), the nowrap Row (Solutions), and the Embed iframe (Grid fixture card 4).
