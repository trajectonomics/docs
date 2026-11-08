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
