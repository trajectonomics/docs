# @trajectonomics/docs

Trajectonomics documentation portal (Fumadocs + Astro) served at trajectonomics.com/docs

[![CI](https://github.com/trajectonomics/docs/actions/workflows/ci.yml/badge.svg)](https://github.com/trajectonomics/docs/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Part of the [Trajectonomics](https://github.com/trajectonomics) ecosystem.

---

## About

Public documentation for the Trajectonomics ecosystem, served at `trajectonomics.com/docs`.
This repository is a deployable site, not a published npm package.

Planned shape (see [issue #1](https://github.com/trajectonomics/docs/issues/1)):

- Static Astro site with Fumadocs, deployed to Cloudflare Workers Static Assets.
- Tab 1, CLI & Quickstart, for end users and operators.
- Tab 2, Build on Trajectonomics, for developers and contributors.
- Docs updated by draft pull request whenever an upstream package releases.

---

## Development

```bash
# Install dependencies
bun install

# Run full verification suite (lint, typecheck, tests, build)
bun run check

# Run tests
bun test

# Code formatting & lint
bun run format
bun run lint
```

---

## Domain Documentation

- [GLOSSARY.md](./GLOSSARY.md): Ubiquitous domain terminology.
- [AGENTS.md](./AGENTS.md): Guidelines and rules for autonomous AI coding agents.
- [CODING_STANDARDS.md](./CODING_STANDARDS.md): Architecture, purity, and review invariants.
- [docs/adr/](./docs/adr/): Architecture Decision Records.

---

## License

[MIT](./LICENSE)
