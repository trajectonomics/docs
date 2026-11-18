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
4. **Every page says so.** A muted one-line pointer — "For AI agents: this page as Markdown · the
   Docs index" — sits in the page's top utility area, with a `<link rel="alternate" type="text/markdown">`
   in the head. It sits before the content column on purpose: the content starts past half the
   page's text on most pages, and a pointer there is a pointer nobody meets.
5. **`verify:build` holds the rule**: a page missing from the index, an index entry with no twin, a
   twin without its title or its index reference, or a page without the alternate link or with the
   pointer after its content fails `bun run check`.
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
