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
| Tabs | In the header (lg and up), in the sidebar Tab dropdown below lg. The current Tab is marked `aria-current="page"`. |
| Width | 1400px for the docs and the Landing Page. |
| Table of contents | Absent on pages without headings. |
| Look | The design-system light/dark Themes (`@trajectonomics/design-system-theme`), mapped onto Fumadocs' `--fd-*` variables by the theme seam and selected by `data-theme` on `<html>`. Self-hosted Inter Variable for type. Radius and shadows stay with the Fumadocs preset until the Semantic Token Contract has length roles (design-system#60). |
| Home link | Header link to `/` (Site Home), relative, full document load. On a Tab page it is in the header from `lg` up and in the sidebar below that. On the Landing Page and the 404 page it is in the header from `sm` up and in the header menu below that. |

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

All from `@trajectonomics/design-system-assets`: the docs pages' header shows the wordmark, and Layout.astro links the Favicon Set. docs owns none. The social card is still pending (design-system#34). The Landing Page header keeps the text title.

## Checking a change

`bun run check` runs `verify:build` against the built site. Layout at 1280, 2000 and 390px and dark mode are checked by screenshots in the pull request until [docs#9](https://github.com/trajectonomics/docs/issues/9) decides a browser test strategy. A Surface ticket — a Spec that names a visual reference ([factory ADR 0017](https://github.com/trajectonomics/factory/blob/main/docs/adr/0017-surface-design-gate.md)) — also commits the rendered screenshots under `docs/screenshots/` on the branch, at 1280, 2000 and 390 px in light and dark, and names the reference in the pull request body; its pull request merges only on the owner's approval review or explicit yes.
