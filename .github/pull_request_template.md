## Description

<!-- Provide a concise summary of the changes introduced by this pull request. -->

## Associated Issue

<!-- Reference the issue this PR addresses (e.g. Closes #12, Fixes #34). -->
Closes #

## PR Title Convention

- [ ] PR title follows [Conventional Commits](https://www.conventionalcommits.org/) (e.g. `feat: add user authentication`, `fix: handle empty payload`).
  - Required types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

## Domain & Architecture Alignment

- [ ] Uses ubiquitous terms defined in [`GLOSSARY.md`](./GLOSSARY.md). No synonyms introduced.
- [ ] Complies with architectural invariants in [`CODING_STANDARDS.md`](./CODING_STANDARDS.md).
- [ ] If architectural decisions were made or updated, recorded in [`docs/adr/`](./docs/adr/).

## Surface & design

<!-- Tick one. The rule is in [docs/agents/planning.md](https://github.com/trajectonomics/docs/blob/main/docs/agents/planning.md). -->

- [ ] **UI change**: user-facing work, so a reader of the Docs Portal sees or does something different. The reference is named, and screenshots at 1280, 2000 and 390 px, light and dark, are attached.
- [ ] **No UI change**: Surface & design is not applicable.

## Pre-Merge Verification

- [ ] `bun run check` passes locally (Biome lint/format, strict typecheck plus `astro check`, tests, Astro build).
- [ ] Added or updated test cases covering positive paths and invariant edge cases.
