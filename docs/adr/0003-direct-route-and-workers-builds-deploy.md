---
status: accepted
---

# The docs Worker takes a direct route and deploys through Workers Builds

The Docs Portal is a Cloudflare Worker with Static Assets, attached directly to `trajectonomics.com/docs` and `trajectonomics.com/docs/*` through `routes` in `wrangler.jsonc`. This supersedes the apex router worker with Service Bindings in point 3 of [`infra` ADR 0004](https://github.com/trajectonomics/infra/blob/main/docs/adr/0004-documentation-portal-architecture-and-sync.md): no such router exists, and building one first would block the portal on infrastructure nothing else needs yet. Adding a router later only changes how traffic reaches this Worker.

Deploys run through Cloudflare Workers Builds, connected to this repository, not a GitHub Actions workflow. Only pushes to `main` deploy, and the build command runs `bun run check` first, so a failing check deploys nothing. Cloudflare holds its own credentials, so no Cloudflare secret is stored in GitHub. The cost is that Cloudflare cannot see GitHub CI results, so the check is repeated in its build command, and the Workers Builds project is configured in the dashboard by a human, not in code.

The route is added in a separate change after the Worker has been verified on its `workers.dev` URL, so a DNS or permission problem on the apex domain cannot block the first deploy.

## Considered Options

- **Router worker with Service Bindings** (the original design). More general, but it needs a router that does not exist yet.
- **GitHub Actions `deploy.yml` with an API token.** Rejected: it puts a Cloudflare token in GitHub secrets for no benefit over Workers Builds.
