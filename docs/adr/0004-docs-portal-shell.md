---
status: accepted
---

# The Docs Portal shell: header Tabs, a Landing Page, a capped layout, neutral until design-system

The Docs Portal keeps the Fumadocs sidebar shell, but makes it deliberate. Decided in [docs#10](https://github.com/trajectonomics/docs/issues/10).

- **Tabs are in the header.** The docs pages use Fumadocs' notebook layout (`nav.mode: "top"`, `tabMode: "navbar"`), which has a real desktop header; the docs layout has none. Below the lg breakpoint the Tabs stay reachable through the sidebar Tab dropdown. A Tab's name is navigation only: the Tab index pages are titled for their role ("Quickstart", "Overview").
- **`/docs/` is a Landing Page**, not a redirect: one calm page with an entry for each audience, generated from the Tab definitions. It is an Astro page, not an MDX page, so a root `index.mdx` must not be added (it would collide) and the Landing Page is not in the search index.
- **The layout is capped** at 1400px on both layouts, with Fumadocs' 900px page column, a hairline sidebar border and no table-of-contents column on pages without headings.
- **The look is neutral for now.** One stylesheet (the theme seam) holds every colour, font and radius the shell sets, so adopting design-system's `--ds-*` Theme CSS later (Web Consumer Contract, design-system ADR 0005) changes one file. docs invents no brand art and defines no third palette. Brand Assets come from `design-system` (design-system#34, #43, #44).
- **`bun run check` verifies the built site.** `verify:build` runs after the build and checks `dist/` through a pure checker. It extends `check`; it loosens nothing, and the Workers Builds command is still `bun run check` ([ADR 0003](./0003-direct-route-and-workers-builds-deploy.md)).

The reference, traits and surface states are in [the design brief](../design/portal-shell.md).

## Considered Options

- **Keep the stock shell.** Rejected: no front door, no visible second audience, a third of a wide screen unused, the Tab name three times.
- **Top navigation only, no sidebar.** Rejected for now: the sidebar suits the reference pages that epic #1 adds, and the notebook layout already gives a header.
- **Wait for design-system before touching the shell.** Rejected: the shell does not depend on tokens or art, and the seam makes the later swap one file.
