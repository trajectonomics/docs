# @trajectonomics/docs

Trajectonomics documentation portal (Fumadocs + Astro) served at trajectonomics.com/docs

[![CI](https://github.com/trajectonomics/docs/actions/workflows/ci.yml/badge.svg)](https://github.com/trajectonomics/docs/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Part of the [Trajectonomics](https://github.com/trajectonomics) ecosystem.

---

## About

The Docs Portal: public documentation for the Trajectonomics ecosystem, served at `trajectonomics.com/docs`
(see [issue #1](https://github.com/trajectonomics/docs/issues/1)). This repository is a deployed site; it is
never published to npm.

- Static [Astro](https://astro.build) site with [Fumadocs](https://fumadocs.dev) (React islands) and the built-in
  local static search (no external search service, no API key).
- Two Tabs: the **Operator tab** (`/docs/cli/`, CLI and quickstart) and the **Builder tab**
  (`/docs/developers/`, build on Trajectonomics). `/docs` redirects to the Operator tab.
- Served by a Cloudflare Worker named `trajectonomics-docs` with Workers Static Assets
  ([`wrangler.jsonc`](./wrangler.jsonc)). Pages are authored in `src/content/docs/`.
- Deployed by Cloudflare Workers Builds from `main`, whose build command runs `bun run check`
  ([ADR 0003](./docs/adr/0003-direct-route-and-workers-builds-deploy.md)). There is no GitHub Actions deploy workflow.

### How `/docs` URLs resolve

Workers Static Assets serves files by request path, so Astro builds into `dist/docs/` (`base: "/docs"`,
`outDir: "./dist/docs"`) and the Worker serves `./dist`. A small build hook writes `dist/_redirects` so that
`/docs` answers with a 302 to `/docs/cli/`.

---

## Development

Requires Bun and Node 22.23.4 or later (Astro; `.node-version` pins 24).

```bash
# Install dependencies
bun install

# Run the full verification suite (lint, typecheck + astro check, tests, build, built-site check)
bun run check

# Check the built site in dist/ on its own (the last step of bun run check)
bun run verify:build

# Develop with hot reload (http://localhost:4321/docs/)
bun run dev

# Build, then serve dist/ exactly as the Worker does (http://localhost:8787/docs/)
bun run preview

# Run tests
bun test

# Code formatting & lint
bun run format
bun run lint
```

`typescript` is pinned to 6.0.x because `astro check` does not support TypeScript 7 yet.

---

## Domain Documentation

- [GLOSSARY.md](./GLOSSARY.md): Ubiquitous domain terminology.
- [AGENTS.md](./AGENTS.md): Guidelines and rules for autonomous AI coding agents.
- [CODING_STANDARDS.md](./CODING_STANDARDS.md): Architecture, purity, and review invariants.
- [docs/adr/](./docs/adr/): Architecture Decision Records.

---

## License

[MIT](./LICENSE)
