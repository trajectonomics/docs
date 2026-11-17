# Design brief: Docs Portal shell

The brief behind [ADR 0004](../adr/0004-docs-portal-shell.md). Language is in [`GLOSSARY.md`](../../GLOSSARY.md).

## Reference and traits

Primary reference: Stripe Docs. Three traits to copy, with no pixel matching:

1. The audience split lives in persistent navigation, and the front door is one calm page.
2. A readable column with generous vertical rhythm. Fumadocs' 900px page column is the measure.
3. Restrained neutral chrome where code blocks and one accent colour carry emphasis.

Hierarchy reference: twenty.com (owner, 14 Nov 2026), for the docs pages only: a quiet header, one large tight-tracked headline, hairline borders, generous space. No product imagery, no extra sections, no palette of its own — the colours are the design-system Themes.

## Shell

| Part | Decision |
| --- | --- |
| Layout | Fumadocs notebook layout with a desktop header and the sidebar. |
| Tabs | In the one header row, centred (lg and up), in the sidebar Tab dropdown below lg. The current Tab is marked `aria-current="page"` ([ADR 0009](../adr/0009-shell-spans-the-page-one-header-row-and-twentys-sidebar.md)). |
| Width | The Landing Page is capped at 1400px. The docs pages span the page: the sidebar sits at the left edge, the table of contents at the right, and the reading column keeps Fumadocs' 900px measure, centred between them ([ADR 0009](../adr/0009-shell-spans-the-page-one-header-row-and-twentys-sidebar.md)). |
| Table of contents | Absent on pages without headings. |
| Look | The design-system light/dark Themes (`@trajectonomics/design-system-theme`), mapped onto the shell's variables by the theme seam and selected by `data-theme` on `<html>`. The Theme is forced to `light` for every reader while the organisation ships one look ([docs#89](https://github.com/trajectonomics/docs/issues/89)): the theme provider's forced value wins over the stored preference and the device's scheme, and the toggle is off. The dark Theme CSS stays loaded and mapped, so dark's return is that one value plus the switch; the seam declares `color-scheme: light` so a reader with JavaScript off gets the light rendering mode too. Contract v2 radius, font-family and font-size roles drive the Tailwind variables the shell consumes, and the spacing scale's base unit drives `--spacing` (design-system#60); the radius roles are declared once for every layout and capped at the card role, so no surface is rounder than a Site card — the Site's shape ([site ADR 0007](https://github.com/trajectonomics/site/blob/main/docs/adr/0007-landing-page-restyle-twenty-language.md), docs#90). Inter Variable ships from the assets package's font stylesheet (design-system#61). The shell draws no shadow: hover reads as the secondary surface, keyboard focus is a 2 px ring on the ring role, and Fumadocs' floating panels take a hairline in place of a shadow. |
| Home link | The Site Home. The docs pages carry it at the top of the sidebar as a bordered button labelled `trajectonomics.com ↗` (relative, full document load, no prefetch), above the search ([ADR 0009](../adr/0009-shell-spans-the-page-one-header-row-and-twentys-sidebar.md)). The Landing Page and the 404 page keep it in the header from `sm` up and in the header menu below that. |

## Landing Page

Portal name, one sentence of purpose, an entry for Operators and an entry for Builders (both from the Tab definitions), and search in the header. The header also carries the Site Home link. Nothing else in the page body.

## Surface states

| State | Behaviour |
| --- | --- |
| Empty | No page is empty: the content skeleton (docs#38) gave every Tab page content. `verify:build` fails a built page that still shows "This page is a placeholder". |
| Loading | None for static pages; the search dialog keeps its Fumadocs states. |
| Error | A failed search-index fetch shows the dialog's empty result; no custom UI. |
| 404 | Our own body inside the shell, with search and a link to `/docs/`. |
| Mobile (390px) | Fumadocs' header menu, sidebar drawer and table-of-contents popover. |

## Assets

All from `@trajectonomics/design-system-assets`: the docs pages' header shows the wordmark, Layout.astro links the Favicon Set, and the global stylesheet imports the Inter Variable font stylesheet (`fonts/inter.css`). docs owns none. The social card is still pending (design-system#34). The Landing Page header keeps the text title.

## Checking a change

`bun run check` runs `verify:build` against the built site. Layout at 1280, 2000 and 390px and dark mode are checked by screenshots in the pull request until [docs#9](https://github.com/trajectonomics/docs/issues/9) decides a browser test strategy. A Surface ticket — a Spec that names a visual reference ([factory ADR 0017](https://github.com/trajectonomics/factory/blob/main/docs/adr/0017-surface-design-gate.md)) — also commits the rendered screenshots under `docs/screenshots/` — `bun run screenshots:curated` writes them — on the branch, at 1280, 2000 and 390 px in light and dark, and names the reference in the pull request body; its pull request merges only on the owner's approval review or explicit yes. The curated set includes the open search dialog at 1280 px and the open phone menu at 390 px, in both Themes: they are the surfaces where a shadow becomes a hairline (docs#90). The shell's geometry — the page-wide grid, the one header row, the sidebar's top block and the light-only Theme — is also checked by `e2e/shell.e2e.ts` (docs#91). While the Theme is forced to light, the set captured with a dark device renders the same light look: both sets stay committed, so dark's return needs no new evidence.
