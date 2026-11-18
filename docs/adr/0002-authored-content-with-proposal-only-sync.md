---
status: accepted
---

# Docs Portal pages are authored here; Docs Sync only proposes edits

The Docs Portal's pages are written and reviewed in this repository for two audiences, the Operator tab and the Builder tab. They are not mirrors of Upstream Package READMEs or ADRs. Those are written for contributors ("Releasing", "Adding a command"), so mirroring them would publish internal material to Operators and tie this site's build to five other repositories. Upstream ADRs are linked on GitHub, never copied.

After an Upstream Package release, Docs Sync reads that repository at the released tag, compares it with the current pages, and opens a **draft** pull request with proposed edits. It never commits to `main`. A manifest in this repository records the last tag synced per Upstream Package.

The portal documents only the latest release of each Upstream Package, with no version switcher. Older docs are available from git tags.

## Considered Options

- **Pull upstream docs at build time.** No drift, but the content is only as good as contributor-facing upstream text, and it removes human review of what the public reads.
- **Generate reference pages from upstream at each release, author guides by hand.** The best long-term fit for API reference, deferred until Upstream Packages have stable public exports. Compatible with this decision.
- **Versioned docs.** Deferred; it multiplies content and sync cost before there is demand.

## Amendment (2026-11-18, docs#113): one release per Tab, and `bun run check` says so

Each Tab names only the release of its Upstream Package that `docs-sync-manifest.json` records:
the tag in an upstream link, a pinned `@trajectonomics/cli` version, and every release stated in
the Operator tab. `src/lib/release-truth.ts` fails the test suite for a page that names another,
so the manifest stays the one place a new tag is chosen and the pages cannot drift from it one at
a time (the drift that left the Operator tab on `v0.1.0` after `v0.2.0` shipped).

## Amendment (2026-11-18, docs#86): a page names the date a command acts on, never that the CLI has no clock

An Operator-tab page says which date a command acts on; it never says the CLI has no clock. The
ledger holds no fact a clock produced, but the row a write returns carries `createdAt` and
`updatedAt` from the machine's clock, `archivedAt` when an account is closed and `deletedAt` when a
Scenario is removed (cli ADR 0018: those are row metadata, not ledger facts).
`src/lib/clock-claims.ts` fails the test suite for a page in the Operator tab that makes the
absolute claim, so the boundary is stated where a reader sees the timestamps and a later edit
cannot put the claim back.
