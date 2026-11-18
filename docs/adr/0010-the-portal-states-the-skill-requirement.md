---
status: accepted
---

# The portal states the skill requirement, not the skill's floor

The Installation page's "Add the agent skill" step sent a reader to the customer skills without
saying which `traj` the operating skill assumes. On a release older than the skills' floor the
operating skill's description promises a projection, a financial-independence date and Thai tax that
the release refuses with `unknown_command`, and the page's "Pin a release" section taught the very
choice that produces that pair (docs#81).

The floor is a fact about another repository. `skills.manifest.json` holds it as one `cliRange` row
per customer skill, and every derived place is written from that row (skills ADR-0002); the CLI's
README deliberately does not restate the number (cli ADR-0035). A second copy on this portal would be
false after the next release, and it would fail the release check's `operator-tab-version` rule at the
next sync while the floor legitimately stayed behind.

## Decision

The Installation page states the requirement, the check and the action: the operating skill expects a
recent `traj`; it describes a projection, a financial-independence date and Thai tax; `traj version`
prints the installed one; the setup skill states the exact floor it needs and checks it, skipping the
operating skill below that floor; and the fix is to install the latest release rather than pin below
it. The operating-skill-only line carries its precondition, because it skips the setup skill's check.
The Agent page names the fix and links to Installation.

The portal prints no floor number, no release line and no upper bound. A reader who wants the exact
number reads it from the setup skill, which is where it is authored and checked.

`bun run check` gains no rule. The fact cannot be read offline, and cli ADR-0034 already places
cross-release freshness checks in an online job so the local check stays offline and deterministic. A
phrase test would hold the copy still without holding it true. The QA pass's `docs` release-truth
check verifies the claim end to end on the published page.

## Consequences

- A release bump on the Operator tab does not reopen this defect and does not force this page to
  change: the copy names no version, so nothing here goes stale when `cli` ships a patch or a minor.
- A reader on an older or pinned `traj` learns, before installing, that the operating skill's promised
  work is not in their release, and how to fix it.
- If the organisation later wants the floor printed on the portal, that is a pull request editing this
  ADR and skills ADR-0002, so the number stays authored in one place.

## Considered options

- **Print the floor next to the install lines.** It is what the QA finding asked for, but it is a
  second authored copy of another repository's fact, it fails the release check at the next cli sync
  (the floor does not move with a patch release), and it goes stale silently when the skills raise it.
- **Add a release rule for a printed floor.** Rejected: it would either compare against a number
  recorded here (a second authored place) or assert that the documented release's minor equals the
  skills' range (a cross-repository convention the organisation has not agreed to), and it would need
  the skills repository's state at build time, which [ADR 0002](./0002-authored-content-with-proposal-only-sync.md)
  refuses.
- **A phrase test that the section names the setup skill first.** Rejected: the order is cli
  ADR-0035's and is already correct; the test would pin copy rather than a fact.
- **State only that a floor exists, as the Agent page did.** Rejected: that is the silence the finding
  reports — a reader cannot tell whether their machine is affected, and setup's skip reads as a broken
  install.
