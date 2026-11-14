---
status: accepted
---

# Staging deploys from `main`; production deploys from the `production` branch

A merge to `main` must not go live. The owner decided on 2026-11-13 that readers of the Docs Portal see a change only when the owner chooses. This supersedes the rule in [ADR 0003](./0003-direct-route-and-workers-builds-deploy.md) that pushes to `main` deploy; its direct route and its use of Workers Builds stay.

There are two Cloudflare Workers from one `wrangler.jsonc`. **Staging** is the Worker `docs-staging`, a Wrangler environment `staging`, built by Workers Builds from `main` and served on its `workers.dev` URL only. **Production** is the Worker `docs`, built from a `production` branch and, once `trajectonomics/docs#4` lands, served at `trajectonomics.com/docs`. The owner moves `production` up to `main` with a fast-forward push (`git push origin origin/main:production`); that push is the trigger. Agents never push `production`, except the one Run that creates it from `main` the first time. Both builds run `bun run check` first, so a failing check deploys nothing in either place. No Cloudflare secret is stored in GitHub and there is no deploy workflow in GitHub Actions.

The route belongs to production only. `env.staging` sets `routes` to an empty list explicitly rather than relying on how Wrangler inherits them, so the route that `trajectonomics/docs#4` adds at the top level can never attach to staging. Rolling production back uses Cloudflare's rollback on `docs`, or a force push of `production` to an earlier commit by the owner.

The Cloudflare projects are configured in the dashboard by the owner (`trajectonomics/infra#46`). Until that is done, a push to `main` still deploys `docs`.

## Considered Options

- **One Worker, versions uploaded from `main` and promoted in the dashboard.** Rejected: the promotion would live only in the dashboard, with no commit saying what went live.
- **Two config files.** Rejected: `assets` and the compatibility date would drift apart.
- **A GitHub Actions promote workflow.** Rejected: it would need a Cloudflare token in GitHub, which ADR 0003 avoids.
- **Keeping staging out of search engines.** Not done here: a headers file would ship in the shared build to production too.
