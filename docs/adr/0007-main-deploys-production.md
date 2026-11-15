---
status: accepted
---

# A merge to `main` deploys production

The Docs Portal is one Cloudflare Worker, `docs`, built by Workers Builds from `main` and served at `trajectonomics.com/docs` through the microfrontend router ([ADR 0006](./0006-docs-portal-through-the-microfrontend-router.md)). Every merge to `main` whose build passes `bun run check` is live when that build finishes. There is no staging Worker and no `production` branch. This supersedes [ADR 0005](./0005-staging-from-main-production-from-the-production-branch.md); Workers Builds and the rule that its build command runs `bun run check` first stay as [ADR 0003](./0003-direct-route-and-workers-builds-deploy.md) recorded them.

The owner chose this on 2026-11-15, after the two-Worker split failed quietly. `docs-staging` was created and then rewired in the Cloudflare dashboard; from 2026-11-14T17:54Z it built nothing. Three merges to `main` (`f37c94b`, `98edfba`, `a47bddd`) produced no Workers Builds check run at all — the Cloudflare check suite on those commits stayed `queued` with zero runs — and the portal went on serving `d848a98` through them. Nothing in this repository could see it: `bun run check` is repo-only, and the dashboard is the only place the trigger is configured. A second project and a branch-control setting are a failure mode no test here can fail on, bought for a gate nobody used.

Giving up the gate is the cost, not an oversight. ADR 0005 existed so that readers see a change only when the owner chooses; `main` now publishes on merge. What stands between a pull request and a reader is `protect-main`, which requires the Lint, Typecheck, Test & Build and Browser tests jobs, and review. The deploy build runs `bun run check` again, so a failing check deploys nothing.

A deploy is proven by two things and by nothing else: a `Workers Builds: docs` check run with conclusion `success` on the merge commit, and the live URL serving that commit. A deployment timestamp is not proof — `wrangler deployments list` and a version's annotations read the same for a manual `wrangler deploy` and a Workers Builds deploy (`Source: Unknown (deployment)`, `workers/triggered_by: version_upload`), so a deploy that never happened can be mistaken for one that did. A dashboard screenshot is not proof either.

Rolling back uses Cloudflare's rollback on `docs`, or a `git revert` merged to `main`, which deploys like any other merge.

## Considered Options

- **Repair staging instead of retiring it.** Rejected: the repair is a dashboard setting with no repo-visible signal, so the same failure returns in silence, and nothing needed a staging URL.
- **Keep one Worker and promote by pushing a `production` branch.** Rejected: it keeps the second moving part (branch control) without the staging Worker and lets the live site and its branch drift apart. On 2026-11-15 the live Worker was eight commits ahead of `production`, so the next build from that branch would have rolled the site back.
- **Deploy from GitHub Actions.** Rejected as in ADR 0003: it puts a Cloudflare token in GitHub secrets for no benefit over Workers Builds.
