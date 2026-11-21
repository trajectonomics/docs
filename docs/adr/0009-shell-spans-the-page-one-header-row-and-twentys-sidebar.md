---
status: accepted
---

# The Docs Portal shell spans the page, its header is one row, and its sidebar is Twenty's

The owner named Twenty's docs (`docs.twenty.com`) as the reference and decided the shape in
[docs#91](https://github.com/trajectonomics/docs/issues/91): the whole layout, one header layer, the
Tabs centred with the search in the sidebar, the Site Home at the top of the sidebar, and one Theme
only. This supersedes the width bullet and the `tabMode: "navbar"` half of the Tabs bullet in
[ADR 0004](./0004-docs-portal-shell.md), and it constrains the light/dark selection of its **look
comes from design-system** bullet to a single Theme, the decision
[ADR 0004's brief](../design/portal-shell.md) records (docs#89). The owner chose the light Theme
first and reversed the decision to dark in the docs#89 Run thread on 17 November 2026; the bullet
below records the reversal.

- **The shell spans the page.** The notebook layout's two side gutters are zero: the sidebar sits
  flush at the left page edge, the table of contents at the right, and the reading column keeps
  Fumadocs' 900px measure, centred in the flexible page track. The home layout (Landing Page, 404
  page) keeps the 1400px cap. The column template is the component's, passed through Fumadocs'
  `containerProps`; the reading column's cap and centring are the shell geometry stylesheet's.
- **The header is one row**, 56px: the wordmark at the left, the header Tabs centred, and no other
  control. The Tabs stay in the header as links while the layout runs in the sidebar Tab mode
  (`tabMode: "sidebar"`), which draws no second row and sets the one-row height; the sidebar's Tab
  dropdown, which that mode renders at every width, is hidden from `lg` up, so the Tabs appear once
  per breakpoint. The current Tab keeps `aria-current="page"` and the built-page check that reads
  the header still passes.
- **The search and the Site Home live at the top of the sidebar.** A bordered Site Home button,
  labelled `trajectonomics.com ↗` (relative `/`, full document load, no prefetch), sits above the
  search trigger, a hairline closes the block, and the tree follows at Twenty's rhythm. The sidebar
  is not collapsible, because the search lives in it and a collapsed sidebar would strand the
  search. Below `lg` the drawer carries the same block above the Tab dropdown.
- **The portal is dark only.** The theme provider forces `dark`, the theme switch is off in both
  layouts, and the seam declares `color-scheme: dark`, so a reader without JavaScript gets dark
  too. The light Theme CSS and its seam stay loaded and mapped: light's return is that one value
  plus the switch. The owner chose the light Theme first and reversed it to dark on 17 November
  2026, in the docs#89 Run thread.

## Considered Options

- **Cap the header at the layout width (the earlier reading of the issue).** Rejected: the owner's
  reference has no capped island, and a full-width header over a capped body leaves the header's
  items detached from the sidebar.
- **Keep the two-row header.** Rejected: the owner asked for one layer, as the reference has.
- **Centre the Tabs and keep the search in the header.** Rejected: the centred Tabs collide with
  the search between 1024 and 1280px, and the search cannot move into a collapsible sidebar without
  being stranded.
- **A custom header component.** Rejected for now: keeping Fumadocs' header keeps the sticky
  offsets, the mobile trigger and the header-height variable the library's, and the shell
  stylesheet can centre the Tabs.

## Amendment (2026-11-18, docs#75): the mark at the left of the row

The header bullet's "the wordmark at the left" is the Site's glyph tile (docs#75): the assets
package's `logo/mark.svg` on a tile painted from the Theme's primary roles, 32 px, linking to
`/docs/` under the accessible name "Trajectonomics Docs" on every page of the Portal. The row keeps
its 56px height and the Tabs their centring; only the mark changes, and the shared layout options
carry it so no page can pick another.

## Amendment (2026-11-18, docs#77): the agent line in the top block

The Portal publishes an Agent-readable form of every page, and each page says so ([ADR 0010](./0010-the-portal-serves-markdown-by-request.md)). One muted line, "For AI agents: this page as Markdown · the Docs index", joins the page's top utility area: at the top of the docs pages' sidebar block, above the Site Home button, and in the Landing Page's header link row beside Site Home — never in the Landing Page's body, which this ADR's home layout keeps to the Landing Page's own parts. The line is text with two links named "Markdown" and "Docs index"; it adds no control, no banner and no colour role, and the Site Home button stays above the search inside the block.

## Amendment (2026-11-21): the agent line leaves the shell

The docs#77 amendment above put a visible agent line in the sidebar's top block and in the Landing Page's header link row. A reader has no use for a sentence addressed to an Agent, so it is withdrawn from both. The top block is again the Site Home button above the search, the Landing Page's header link row again carries the Site Home link alone, and the sidebar block no longer takes the page's path. The pointer for an Agent moves to the top of the page's body, where no reader meets it ([ADR 0010](./0010-the-portal-serves-markdown-by-request.md)).
