---
status: accepted
---

# The deploy gate checks the build output; browser tests run in a separate CI job

The Docs Portal is tested through its built site, at one seam: `dist/` as served by `wrangler dev`, which applies the same redirect, trailing-slash and 404 rules as production ([ADR 0003](./0003-direct-route-and-workers-builds-deploy.md)). Two layers follow from what each runner can do.

The **deploy gate** is `bun run check`, which Workers Builds runs before every deploy of `main`. It cannot run a browser, so it stays browser-free. It gains one file-based step after the build, `verify:build`, that checks the build output: the static search index parses and has an entry for every content page, the 404 page and the Landing Page exist, the Landing Page is not a redirect and links to the two Tabs only, and no built redirect rule sends readers to the Operator tab. A broken index therefore blocks a deploy.

**Browser tests** use Playwright (Chromium only) in a separate `e2e` job in the existing CI workflow, on pull requests and on `main`. They cover the site contract, search and Tab navigation, accessibility (axe-core, serious and critical), and layout invariants (no horizontal scroll, visible h1) at 1280, 2000 and 390 px. The job uploads screenshots at those widths as an artifact for humans to look at. There are no pixel diffs and no committed baselines until the shell design (#10) is stable. There is no React Testing Library level: the islands are thin wiring around Fumadocs, and a simulated DOM would mostly assert mocks of Astro's virtual modules; revisit when an island gains logic of its own.

Playwright runs on Node through its own bin, a narrow exception to Bun as the test runner in [ADR 0001](./0001-core-architecture-decisions.md) and to `AGENTS.md` rule 4. Its specs use the `.e2e.ts` suffix in `e2e/`, which `bun test` never discovers, and the default `test` script is scoped to `./src ./scripts`.

A push to `main` deploys whether or not the `e2e` job passes, and `main` has no branch protection yet, so `e2e` is advisory until the owner makes it a required check (`trajectonomics/infra#32`).

## Considered Options

- **Playwright inside `bun run check`.** Rejected: Workers Builds cannot run browsers, and installing them there would slow and destabilise every deploy.
- **A React Testing Library level for the islands.** Rejected for now, as above.
- **Pixel-diff visual regression.** Deferred until #10 settles the shell; baselines would churn with every layout change.
- **`astro preview` as the test server.** Rejected: it does not apply the Worker's asset rules (redirects, 404 page).
- **A shared Playwright workflow in `cicd`.** Deferred until a second repository has a browser-tested site.
