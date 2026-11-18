---
status: accepted
---

# The `sim-core` example is executed in the deploy gate

The `sim-core` page on the Builder tab publishes the one TypeScript program the Docs Portal offers for
`@trajectonomics/sim`, and nothing in this repository ever ran it: the fence called
`project(baseline, scenario, ...)` with both identifiers defined nowhere, and the deploy gate
typechecks `src/`, `scripts/` and `e2e/` and never `src/content`. A Builder who copied the page got
`ReferenceError: baseline is not defined`. This records the rule that closes that gap for this page.

## Decision

1. **The page's TypeScript fence is a complete program.** Every `ts` or `typescript` fence on the
   `sim-core` page defines every value it uses, is typed with the package's exported types, and runs
   as printed.
2. **`bun run check` executes it.** One test reads the real content tree, lifts each program out of
   the page, and runs it with `bun -e` from the repository root. A run is green when it exits 0 and
   writes nothing to stderr: the engine returns `ok: false` instead of throwing, and the example's
   failure branch writes `problems` there, so stderr is the failure signal. A failure names the page
   and the program's first line.
3. **The package is an exact devDependency.** `@trajectonomics/sim` is a `devDependencies` entry at
   the one release the page documents, never a range, so `bun.lock` fixes the bytes the check runs.
   Nothing goes into `dependencies`: the site build never imports the package.
4. **The pin follows the sync manifest.** A test requires the pin to equal the `sim-core` tag in
   `docs-sync-manifest.json`, the same reconciliation `release-truth` already applies to the page's
   upstream links (ADR 0002's amendment). A manifest bump and a pin that do not move together fail
   together, instead of the check going on proving an older release than the page documents.
5. **It is scoped to this page.** A second Upstream Package page opts in with its own exact pin and
   its own Ticket; the extraction function is generic, so an opt-in is a page entry, not a second
   mechanism.

## The gate stays offline

`bun run check` makes no network call, and this does not change that. The lockfile is the network
boundary: `bun install --frozen-lockfile` fetches the package before the gate runs, exactly as it
fetches `astro`, `fumadocs` and the `@trajectonomics/design-system` packages the site already builds
against, and the test then resolves it from `node_modules` with `--no-install` so a missing package
fails instead of being fetched mid-run. An exact version is what keeps the run deterministic.

This is a different shape from the two checks next to it, and deliberately so. A page bound to an
upstream **wire contract** is kept by a copied constant compared against the built page in
`verify:build` ([ADR 0010](./0010-a-page-bound-to-an-upstream-wire-contract-is-checked.md)). A check
that reads the registry **live** leaves the gate for a job of its own (docs#93), the way the browser
tests did ([ADR 0004](./0004-browser-tests-run-outside-the-deploy-gate.md)). This one is neither: it
needs the published package present to run the program, and it must run at the source seam, because
the program a reader copies is the source, not the highlighted HTML — and reading a program back out
of highlighted markup is lossy. The built page's code blocks stay covered by
`e2e/code-blocks.e2e.ts`.

## Considered Options

- **A `tsc` pass over the fence.** Rejected: `check()` validates every field and type at runtime, and
  a program that lives in MDX has no tsconfig project, so this buys a generated project or a virtual
  compiler host for a gap the engine already closes at runtime.
- **Committed `.d.ts` stubs instead of the real package.** Rejected: a copied type surface drifts
  silently and proves nothing about the program running. ADR 0002's own habit is to link an upstream
  contract rather than copy it.
- **A copied expected result compared against the built page.** Rejected: the page's defect was that
  the program does not run, and no comparison of rendered text can tell a program that runs from one
  that does not.
- **Extracting the fence from the built HTML.** Rejected: the highlighter splits lines into spans, so
  reading a program back out of the build is lossy and would test a re-assembly, not the page.
- **No check.** Rejected: the page shipped an unrunnable program and nothing here could notice.

## Consequences

- A Builder page's example is proven against the release the page names, and a `sim-core` release
  that changes the Schema fails this repository's check until the example is brought along.
- The gate gains one immutable package in its install (with no dependencies of its own) and one test
  that spawns a bounded `bun` process.
- A second Upstream Package page costs its own exact pin, so the coupling grows one package at a time
  rather than all at once.
