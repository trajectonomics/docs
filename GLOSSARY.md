# Domain Glossary: @trajectonomics/docs

Ubiquitous language for `trajectonomics/docs`. Every term defined here is binding across code, tests, documentation, and PR titles. Synonyms in a diff are defects.

## Core Terms

### Docs Portal
The public documentation site served at `trajectonomics.com/docs`, built with Astro and Fumadocs and deployed as a Cloudflare Workers Static Assets micro-frontend.

### Tab
A top-level navigation section of the Docs Portal aimed at one audience. There are two: CLI & Quickstart (`cli/`, end users and operators) and Build on Trajectonomics (`developers/`, developers and contributors).

### Upstream Package
A Trajectonomics repository whose documentation this portal carries: `cli`, `sim-core`, `ledger-core`, `tax-core`, `design-system`.

### Upstream Release
A production release of an Upstream Package. It dispatches an `upstream_release` event with `{ repo, tag, changelog }` and triggers a Docs Sync.

### Docs Sync
The automated step that turns an Upstream Release into documentation updates, always delivered as a Draft Pull Request and never committed to `main`.

### Invariant
A rule or condition that must hold true across all state transitions in this system.
