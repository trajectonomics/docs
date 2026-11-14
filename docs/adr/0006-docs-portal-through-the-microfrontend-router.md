---
status: accepted
---

# The Docs Portal is reached through the microfrontend router

The owner chose the microfrontend router (`trajectonomics/web-router`) for `trajectonomics.com`: the site at `/`, the Docs Portal at `/docs`. This supersedes the direct-route half of [ADR 0003](./0003-direct-route-and-workers-builds-deploy.md). Workers Builds stays as ADR 0003 recorded it, including the rule that a failing `bun run check` deploys nothing. Who deploys staging and production stays as [ADR 0005](./0005-staging-from-main-production-from-the-production-branch.md).

The production Worker `docs` has no `routes` and no custom domain. The router Worker owns the apex and forwards `/docs` and everything under it to `docs` by a service binding. That restores point 3 of [`infra` ADR 0004](https://github.com/trajectonomics/infra/blob/main/docs/adr/0004-documentation-portal-architecture-and-sync.md) (route `trajectonomics.com/docs/*` at the apex router through a service binding), which the direct-route paragraph of ADR 0003 had superseded. The router binds the production Worker `docs` only. Staging (`docs-staging`) stays on its `workers.dev` URL, so readers of the public address see production only.

The Docs Portal keeps serving under `/docs/...`, on its `workers.dev` URL and behind the router. Astro's `base` stays `/docs` and the build stays in `dist/docs`, which [ADR 0001](./0001-core-architecture-decisions.md) and the browser-test seam in [ADR 0004](./0004-browser-tests-run-outside-the-deploy-gate.md) already decide. The router forwards that path unchanged: it leaves the `/docs` prefix in place, and it leaves HTML, CSS, `Location` and `Set-Cookie` alone on this mount. The router's default, in [web-router ADR 0002](https://github.com/trajectonomics/web-router/blob/main/docs/adr/0002-microfrontend-router-on-cloudflare-workers.md), strips the mount prefix and then rewrites those fields. On this mount that would turn `/docs/_astro/...` into `/docs/docs/_astro/...` and would rewrite the `/docs/` redirect this Worker already sends. The router's route table matches both `/docs` and `/docs/*`. A static `/docs` entry matches only the exact path. `preload` on that mount requests `/docs`, which this Worker redirects to `/docs/`. Matching both paths, forwarding unchanged, and skipping the rewrite is [`trajectonomics/web-router#4`](https://github.com/trajectonomics/web-router/issues/4), including the binding name `docs` (the production Worker name in ADR 0005). `trajectonomics-docs` is the name the Worker config used before that rename (`docs#45`).

This repository keeps its base and its asset paths. It sets no content security policy. A later change must leave the router's injected inline style and script allowed, and must leave `/__mf-preload.js` unserved, because the router reserves that path ([`trajectonomics/web-router#6`](https://github.com/trajectonomics/web-router/issues/6)). A router change that needs this Worker to serve different paths is a new decision in this repository.

Apex DNS, attaching the router's domain, and Email Routing stay with the owner ([`trajectonomics/infra#44`](https://github.com/trajectonomics/infra/issues/44)). The prerequisites that were on `trajectonomics/docs#4` are recorded there: a proxied apex record (a placeholder `AAAA` for `@` pointing at `100::` when the apex has no origin), a check that no other Worker route, Redirect Rule or Pages custom domain catches `/docs`, and a path for route permissions if attaching the domain from config fails. `docs#4` is closed. This Worker does not take a direct apex route.

`env.staging` keeps an explicit empty `routes` list (ADR 0005). A test of the Worker config asserts that neither the top level nor any environment declares a non-empty `route`, `routes` or `custom_domain`. That empty list and that test are the guard against a future direct route.

## Considered Options

- **Direct `routes` on this Worker** (ADR 0003 and `docs#4`). The owner chose one router for the apex, so the direct route is not added.
- **Move this Worker's base to `/` and let the router strip `/docs`.** That would change the `workers.dev` URL and the browser-test seam. The router adapts to the path this Worker already serves.
