---
status: accepted
---

# The Docs Portal shell spans the page, its header is one row, and its sidebar is Twenty's

The owner named Twenty's docs (`docs.twenty.com`) as the reference and decided the shape in
[docs#91](https://github.com/trajectonomics/docs/issues/91): the whole layout, one header layer, the
Tabs centred with the search in the sidebar, the way back to the Site at the top of the sidebar, and
the light Theme only. This supersedes the width bullet and the `tabMode: "navbar"` half of the Tabs
bullet in [ADR 0004](./0004-docs-portal-shell.md), and it delivers the light-only decision
[ADR 0004's brief](../design/portal-shell.md) records (docs#89).

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
- **The search and the way back to the Site live at the top of the sidebar.** A bordered
  `trajectonomics.com ↗` button (relative `/`, full document load, no prefetch) sits above the
  search trigger, a hairline closes the block, and the tree follows at Twenty's rhythm. The sidebar
  is not collapsible, because the search lives in it and a collapsed sidebar would strand the
  search. Below `lg` the drawer carries the same block above the Tab dropdown.
- **The portal is light only.** The theme provider forces `light`, the theme switch is off in both
  layouts, and the seam declares `color-scheme: light`, so a reader without JavaScript gets light
  too. The dark Theme CSS and its seam stay loaded and mapped: dark's return is that one value plus
  the switch.

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
