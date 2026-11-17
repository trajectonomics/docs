---
status: accepted
---

# The Docs Portal shell: header Tabs, a Landing Page, a capped layout, themed by design-system

The Docs Portal keeps the Fumadocs sidebar shell, but makes it deliberate. Decided in [docs#10](https://github.com/trajectonomics/docs/issues/10).

- **Tabs are in the header.** The docs pages use Fumadocs' notebook layout (`nav.mode: "top"`, `tabMode: "navbar"`), which has a real desktop header; the docs layout has none. Below the lg breakpoint the Tabs stay reachable through the sidebar Tab dropdown. A Tab's name is navigation only: the Tab index pages are titled for their role ("Quickstart", "Overview").
- **`/docs/` is a Landing Page**, not a redirect: one calm page with an entry for each audience, generated from the Tab definitions. It is an Astro page, not an MDX page, so a root `index.mdx` must not be added (it would collide) and the Landing Page is not in the search index.
- **The layout is capped** at 1400px on both layouts, with Fumadocs' 900px page column, a hairline sidebar border and no table-of-contents column on pages without headings.
- **The look comes from design-system.** The theme seam maps the `--ds-*` Theme roles onto the variables the shell reads: the colour roles onto Fumadocs' `--fd-*` variables; the Contract v2 radius, font-family and font-size roles (design-system#60) onto Tailwind's `--radius-*`, `--font-*` and `--text-*` namespaces; and the spacing scale's base unit onto `--spacing`. The radius roles are declared once on `:root`, so the Landing Page, the 404 page and every docs page read the same corners, and the shell caps every radius role it consumes at the card role, so no Fumadocs surface is rounder than a Site card (docs#90, taking the shape of [site ADR 0007](https://github.com/trajectonomics/site/blob/main/docs/adr/0007-landing-page-restyle-twenty-language.md)). The layout width and the `--font-sans` assignment stay seam exceptions; Inter Variable ships from the assets package's font stylesheet (design-system#61). The shell draws no shadow: header and sidebar controls read flat on hover, keyboard focus is a 2 px ring on the ring role, and Fumadocs' floating panels take a hairline instead of a shadow. The prebuilt light/dark Theme CSS from `@trajectonomics/design-system-theme` (Web Consumer Contract, design-system ADR 0005) is selected by the `data-theme` attribute on `<html>`, which the theme provider emits together with the `.dark` class (`attribute: ["class", "data-theme"]` in provider.tsx; Layout.astro carries the static light fallback). docs invents no brand art and defines no third palette. The header of the docs pages shows the wordmark and the Favicon Set comes from `@trajectonomics/design-system-assets` (design-system#34, #43, #44, #50).
- **`bun run check` verifies the built site.** `verify:build` runs after the build and checks `dist/` through a pure checker. It extends `check`; it loosens nothing, and the Workers Builds command is still `bun run check` ([ADR 0003](./0003-direct-route-and-workers-builds-deploy.md)).

The reference, traits and surface states are in [the design brief](../design/portal-shell.md).

## Considered Options

- **Keep the stock shell.** Rejected: no front door, no visible second audience, a third of a wide screen unused, the Tab name three times.
- **Top navigation only, no sidebar.** Rejected for now: the sidebar suits the reference pages that epic #1 adds, and the notebook layout already gives a header.
- **Wait for design-system before touching the shell.** Rejected: the shell does not depend on tokens or art, and the seam makes the later swap one file.

## Amendment (2026-11-17, docs#90): the Site's flat shell

The owner asked for the Docs Portal to read as the same family as the Site (docs#90: "I think the docs still does not use the same style as site we still have round and all that"). The Site had already been restyled in twenty.com's flat language ([site ADR 0007](https://github.com/trajectonomics/site/blob/main/docs/adr/0007-landing-page-restyle-twenty-language.md)), and the Portal was the rounder, softer of the two: 12 px shell cards from a seam override, 8 px Landing Page entries from the preset, up to 16 px on Fumadocs' dialog and the phone menu, and a soft hover and focus shadow on the header and sidebar controls. This amendment supersedes the Look bullet's sentence about scoping the radius roles to the docs layout and its sentence about composing the control shadows.

- **Shape.** 4 px on controls and 6 px on cards and panels, from the Contract v2 roles (`radius.sm`, `radius.md`) — the Site's own split, with no 12 px surface because the Portal has no terminal window. The radius roles are declared once on `:root`, for every layout, and the shell caps the roles it consumes at the card role, including `--radius-2xl`, so a Fumadocs dialog or drawer cannot be rounder than a Site card. `rounded-full` stays: a pill or a circle is a shape, not a corner treatment, and it is not driven by `--radius-*`.
- **Hairlines, not shadows.** The shell declares no `box-shadow` at all. Fumadocs' floating panels lose theirs and take a hairline in the border role; hover on header and sidebar controls keeps its flat secondary-surface cue; keyboard focus is a 2 px `outline` on the ring role, because that shadow had been those links' only focus indicator.
- **Every layout, both Themes.** The home layout (Landing Page, 404 page) and the notebook layout (docs pages) read one set of roles, and radius and shadow are non-colour roles that resolve identically in both Themes.

The change stays in the seam rather than in design-system: changing a `radius.*` role value would restyle the Site against its own ADR 0007, which already rejected a 2 px radius because 2 px is not on the scale, and adding a role is a separate Spec (design-system ADR 0005).

### Considered Options (the flat shell)

- **Square corners (0 px).** Rejected: 0 is not on the published scale, so the Portal would carry a shape of its own, and it would be sharper than the Site it is meant to match.
- **Change the design system's radius roles.** Rejected: it restyles the Site against site ADR 0007.
- **Keep the Landing Page's preset corners.** Rejected: the front door would stay the roundest page in the Portal.
- **Keep a shadow on the search dialog and the phone menu.** Rejected: the Site's flat language is hairlines, and those panels separate from the page by their surface role.

## Amendment (2026-11-17, docs#91): the page-wide shell and the one-row header

The owner chose Twenty's docs as the reference and asked for the whole layout and one header layer
(docs#91). [ADR 0009](./0009-shell-spans-the-page-one-header-row-and-twentys-sidebar.md) supersedes
this ADR's **layout is capped** bullet for the docs pages — they span the page, with the 1400px cap
left to the home layout — and the `tabMode: "navbar"` half of its **Tabs are in the header** bullet:
the header is one row with the Tabs centred, the search and the way back to the Site live at the top
of a non-collapsible sidebar, and the portal renders the light Theme only.
