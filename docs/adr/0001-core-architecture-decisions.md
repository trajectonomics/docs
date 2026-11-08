# ADR 0001: Architecture Foundations for @trajectonomics/docs

## Status

Accepted

## Context

`trajectonomics/docs` is the Trajectonomics documentation portal (Fumadocs + Astro) served at trajectonomics.com/docs.
It is private and deployed, not published to npm.
It is built with Bun, TypeScript, and Biome under the Trajectonomics architectural guidelines.

## Decision

1. **Archetype**: Configured as `minimal`.
2. **Language & Runtime**: TypeScript in strict mode, with Astro, Fumadocs and React for the site and Bun as the package manager and test runner.
3. **Domain Integrity**: All domain concepts adhere to [GLOSSARY.md](../../GLOSSARY.md).
4. **Agent Collaboration**: AI agents adhere to [AGENTS.md](../../AGENTS.md) and [CODING_STANDARDS.md](../../CODING_STANDARDS.md).

## Consequences

- Invariants remain verifiable through deterministic tests (`bun test`) and `bun run check`.
- All autonomous agent work is test-first and reviewed against established coding standards.
