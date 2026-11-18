---
status: accepted
---

# The command reference's drift from the published release is checked by a workflow job

The Operator tab is the reference a person reads before installing `traj`, and its pages are
authored here ([ADR 0002](./0002-authored-content-with-proposal-only-sync.md)). Nothing in this
repository failed when they stopped matching the published CLI: `bun run check` is offline and
deterministic by rule (AGENTS.md rule 3) and cannot read a release, and the release-truth step of the
docs playbook runs only inside a QA pass. `traj scenario apply --template` shipped in
`@trajectonomics/cli` `0.2.0` and appeared on no page until [docs#93](https://github.com/trajectonomics/docs/issues/93).

The shape was already decided. [ADR 0004](./0004-browser-tests-run-outside-the-deploy-gate.md) put a
check the deploy gate cannot run — the browser tests — in its own CI job, and
[ADR 0010](./0010-a-page-bound-to-an-upstream-wire-contract-is-checked.md) began the content-truth
family: `verify:build` keeps a page to a wire contract copied from the release the sync manifest
records. This is the same family, one seam higher.

## Decision

`.github/workflows/command-reference.yml`, job `Command reference`, compares the published release
with the pages under `src/content/docs/cli/commands/` and fails on the difference:

- It reads the npm registry's `dist-tags.latest` for `@trajectonomics/cli`, waiting up to ten
  minutes for the version to be servable, then `bunx @trajectonomics/cli@<version> schema <leaf>
  --json` per leaf. A leaf's flags are the properties of its input JSON Schema minus its
  `positionals`, kebab-cased — structured, not the `traj help` text. The four global flags are the
  one value no schema carries, and come from one `help <leaf>` call.
- Four rules, one code each: a released leaf with no page or section; a heading naming a leaf the
  release does not have; a released flag with no bullet in its leaf's section; a bullet naming a
  flag the release rejects. Bullets are the claim surface, so bash example fences and positional
  bullets cannot satisfy or fail a rule by accident.
- It compares against `latest`, not the tag in `docs-sync-manifest.json`, on purpose:
  `src/lib/release-truth.ts` keeps pages and the manifest agreeing, and only a comparison with
  `latest` can see that the manifest itself is stale — the drift that left the Operator tab on
  `v0.1.0` (ADR 0002's amendment).
- On a pull request it fails only on drift the pull request introduces. The baseline is the merge
  base of the head and the base branch, and problems are matched by `(rule, file, leaf, flag)`
  identity, never by message, so a release that lands mid-pull-request cannot turn an unrelated
  change red and make the check unsafe to require.
- The weekly and manual runs fail on any drift and also open or update one issue titled
  `Command reference drift`, labelled `needs-triage`, closed when a later run is clean. The red run
  blocks the pull request a drift arrived in; the issue reaches triage when no pull request exists.
  `cicd`'s tooling-drift job reports without failing because a broken pin is not a change's fault;
  here the drift the pull request carries is.
- The rules live in a pure module, `src/lib/command-reference/`, and the runner in
  `scripts/check-command-reference.ts`, reached by `bun run check:command-reference`. Neither is in
  `check`: the offline deploy gate stays offline.

It stays advisory until the `protect-main` ruleset requires it
([trajectonomics/infra#72](https://github.com/trajectonomics/infra/issues/72)); requiring a check is
a repository setting only the owner changes, as with the browser tests (infra#32).

## Considered options

- **Compare inside `bun run check`.** Rejected: it needs the network, it would fail the deploy build
  whenever npm or a release misbehaved, and AGENTS.md rule 3 keeps the gate deterministic.
- **Compare against the sync manifest's tag only.** Rejected: a check that reads only the manifest
  can never see a stale manifest, which is the failure ADR 0002's amendment records.
- **Parse `traj help` for flags.** Rejected: the per-leaf schema is structured and already carries
  the flag set; keeping text parsing to the four global flags keeps the parse surface small.
- **Generate the pages from the schema.** Rejected by ADR 0002: pages are authored here and reviewed.
  A checker does not remove the author.
- **File the weekly report only, without failing.** Rejected: a report nobody opens is the state this
  replaces, and the pull-request failure is the part that stops the drift spreading.

## Consequences

- The command reference now has the release as its oracle, on the same schedule as the release
  itself, without the deploy gate learning to use the network.
- A release that adds or removes a command or flag turns the check red until its pages catch up; the
  pull-request rule keeps that red from landing on work that did not cause it.
- The check's reach is deliberately narrow: the error registry, the command count and the command
  table on the commands page, `meta.json` navigation and every page outside the command reference
  stay unchecked, and a new top-level command with no page already fails the first rule.
- A new content-truth check that needs the network follows this shape: a pure module, a runner, its
  own workflow, and an owner change to the ruleset before it blocks anything.
