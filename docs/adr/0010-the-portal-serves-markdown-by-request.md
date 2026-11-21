---
status: accepted
---

# The Portal serves Markdown by request, and publishes the index an Agent reads first

A Docs Portal page was readable only as HTML: no `/docs/llms.txt`, no Markdown form of a page, and
`Accept: text/markdown` answered with `text/html`. `afdocs@0.23.0` scored the live Portal 41/100,
with Content Discoverability and Markdown Availability both 0, against a docs Surface contract that
requires 85 or more and both sub-scores at 100 ([`docs/qa-runbook.md`](https://github.com/trajectonomics/factory/blob/main/docs/qa-runbook.md)).
Parsing HTML worked, which is why the page-level checks already scored 97–100: the words were fine
and the delivery path for an Agent was missing (docs#77).

## Decision

1. **An index at `/docs/llms.txt`**, built from the same content the page routes and the search
   index read, in the llmstxt.org shape: an H1, a blockquote, a sentence on how to fetch Markdown,
   then a section per Tab plus a "Start here" line, one bullet per page naming that page's Markdown
   twin with its description. The links are absolute (`https://trajectonomics.com/docs/...md`),
   because the file is read away from the site.
2. **A Markdown twin of every page a reader can reach**, at `<page>.md` — `/docs/cli/` has
   `/docs/cli.md`, and the Landing Page has `/docs/index.md`. The twin is the authored source, not a
   second copy and not an HTML-to-Markdown conversion: the frontmatter becomes the title and the
   description, the body follows verbatim, and links under `/docs/` are made absolute so a twin
   pasted into a context still resolves. A page whose body carries a JSX component has no faithful
   twin, so the build fails it rather than ship a twin that dropped content.
3. **The Worker answers `Accept: text/markdown`.** The assets-only Worker gains an entry module and
   an assets binding, and `run_worker_first` names `/docs` and `/docs/*`. For a page path whose
   request accepts Markdown and whose twin exists, it answers with the twin as
   `text/markdown; charset=utf-8`; everything else goes through `env.ASSETS.fetch(request)`, so
   `html_handling` and `not_found_handling` keep deciding the `/docs` → `/docs/` redirect, the
   aliases and the 404 page. The media type is parsed from `Accept`, not substring-matched: `*/*`
   and `text/*` keep HTML and `q=0` refuses. Both the negotiated and the HTML response for a page
   carry `Vary: Accept`, so no shared cache serves one form for the other.
4. **Every page says so, to an Agent.** A one-line pointer — "For AI agents: this page as Markdown ·
   the Docs index" — opens every page's `<body>`, with a `<link rel="alternate" type="text/markdown">`
   in the head. It is for an Agent and never for a reader: the line is clipped to a pixel, kept out of
   the accessibility tree and its links out of the tab order, so a reader sees nothing and a keyboard
   stops nowhere (see the amendment below).
5. **`verify:build` holds the rule**: a page missing from the index, an index entry with no twin, a
   twin without its title or its index reference, or a page without the alternate link, or whose
   pointer is missing from what an Agent reads (the page without its `<nav>`, `<script>` and `<style>`
   elements) or sits after its content, fails `bun run check`.
6. **The check stays offline.** `afdocs` is the QA tool, not a dependency: the built-page rules and
   the browser tests carry the regression, and a QA pass measures the live site.

## Considered Options

- **Negotiate in `web-router`.** Rejected: the router forwards `/docs` unchanged on purpose and owns
  the apex ([ADR 0006](./0006-docs-portal-through-the-microfrontend-router.md)); a Worker's URL
  semantics belong in the Worker that serves its pages.
- **Render the page and convert the HTML to Markdown.** Rejected: a new dependency and a lossy
  second copy of words that already exist as Markdown.
- **Ship only the `.md` URLs, with no negotiation.** Rejected: Markdown Availability requires the
  negotiated response, and an Agent that asks for Markdown should not need to know a URL convention.
- **Add `afdocs` to `bun run check`.** Rejected: a network call in the check that Workers Builds
  gates a deploy on ([ADR 0003](./0003-direct-route-and-workers-builds-deploy.md)).
- **A visible line for readers as well as Agents.** Rejected (amendment below): a reader has no use for
  a sentence addressed to an Agent, and a second, hidden copy for the Agent would be two pointers for
  one reader.
- **Publish the apex `/llms.txt` or a sitemap here.** Rejected: the apex belongs to `site` and
  `web-router` (ADR 0006); docs#107 proposes the Portal's own sitemap and is not a dependency of
  this decision.

## Consequences

- `run_worker_first` invokes the Worker for every request under `/docs` and `/docs/*`, the
  stylesheets and scripts included; they are forwarded unchanged to the assets. The Portal's traffic
  is low, there is still one Worker, and there is no dashboard change.
- A new page fails `bun run check` until the index and twin rules are satisfied, which is the point:
  the index cannot silently omit a page.
- The twin is the authored page, so the page and its Markdown cannot drift; a JSX body in a page is
  now a build failure rather than a silent omission in its twin.
- The apex `/llms.txt`, `/robots.txt` and `/sitemap.xml` remain outside this repository.

## Amendment (2026-11-21): the pointer is for Agents, not for readers

Decision 4 first put the pointer in the shell as a muted visible line: at the top of the docs pages'
sidebar block, above the Site Home button, and in the Landing Page's header link row, so that a reader
and an Agent would find the same thing. A reader has nothing to do with it, and it stood in the two
places a reader looks first. It also served the Agent less well than it should: `afdocs` removes
`<nav>` before it looks, and the Landing Page's copy sat inside the header's `<nav>`, so it was not
found there at all; the sidebar's copy stood between 16% and 63% of a page's text, never within the
first 10% that `afdocs` counts as near the top, and past the 50% it counts as buried on one page.

The pointer is now one element at the top of every page's `<body>`, written by the base layout from
the same Markdown twin path the head's alternate link takes. `afdocs` asks for exactly this: a
visually hidden element near the top of each page, with a link to `llms.txt`.

- **Hidden from a reader by every route.** It is `sr-only` (clipped to a pixel), `aria-hidden`, and
  its two links carry `tabindex="-1"`: a sighted reader sees nothing, a screen reader announces
  nothing, and a keyboard stops on nothing. An Agent that reads the HTML, with or without applying
  CSS, finds it first. An Agent that reads only the accessibility tree does not, and has the head's
  alternate link, `Accept: text/markdown` and `/docs/llms.txt` instead.
- **Out of the shell.** It is no part of the sidebar block, a header or an island, so the sidebar
  block no longer takes the page's path or follows the Client Router: the router swaps the body, and
  each page brings its own pointer. The 404 page has no twin and carries neither the pointer nor the
  alternate link.
- **Placed where the check reads.** `verify:build` reads a page the way `afdocs` does, so a pointer
  inside a `<nav>`, a script or a style no longer counts. On the built pages the pointer now stands
  within the first 1% of every docs page's text and the first 6% of the Landing Page's.
- **What a reader loses.** A reader who wants the Markdown of the page they are on has no link to it
  now; the `.md` URL still works by hand. A control for readers is a separate Surface decision, with
  its own reference and screenshots, and not a part of this one.
