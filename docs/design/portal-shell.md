# Design brief: Docs Portal shell

The brief behind [ADR 0004](../adr/0004-docs-portal-shell.md). Language is in [`GLOSSARY.md`](../../GLOSSARY.md).

## Reference and traits

Primary reference: Stripe Docs. Three traits to copy, with no pixel matching:

1. The audience split lives in persistent navigation, and the front door is one calm page.
2. A readable column with generous vertical rhythm. Fumadocs' 900px page column is the measure.
3. Restrained neutral chrome where code blocks and one accent colour carry emphasis.

## Shell

| Part | Decision |
| --- | --- |
| Layout | Fumadocs notebook layout with a desktop header and the sidebar. |
| Tabs | In the header (lg and up), in the sidebar Tab dropdown below lg. The current Tab is marked `aria-current="page"`. |
| Width | 1400px for the docs and the Landing Page. |
| Table of contents | Absent on pages without headings. |
| Look | Neutral Fumadocs preset plus the theme seam stylesheet. |

## Landing Page

Portal name, one sentence of purpose, an entry for Operators and an entry for Builders (both from the Tab definitions), search in the header. Nothing else.

## Surface states

| State | Behaviour |
| --- | --- |
| Empty | No page is empty: the content skeleton (docs#38) gave every Tab page content. `verify:build` fails a built page that still shows "This page is a placeholder". |
| Loading | None for static pages; the search dialog keeps its Fumadocs states. |
| Error | A failed search-index fetch shows the dialog's empty result; no custom UI. |
| 404 | Our own body inside the shell, with search and a link to `/docs/`. |
| Mobile (390px) | Fumadocs' header menu, sidebar drawer and table-of-contents popover. |

## Assets

All from `design-system`: wordmark and logo mark (SVG), Favicon Set, social card. docs owns none. Until they ship the header shows the text title.

## Checking a change

`bun run check` runs `verify:build` against the built site. Layout at 1280, 2000 and 390px and dark mode are checked by screenshots in the pull request until [docs#9](https://github.com/trajectonomics/docs/issues/9) decides a browser test strategy.
