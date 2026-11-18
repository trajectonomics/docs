---
status: accepted
---

# A page bound to an upstream wire contract is kept by a built-page check

`traj tx import` reads exactly one CSV template, and its header
`date,from,to,amount,memo,external_ref,project` is a wire contract that external prompts and scripts
target ([cli ADR 0025](https://github.com/trajectonomics/cli/blob/v0.2.0/docs/adr/0025-csv-import-is-one-template.md)).
The `tx` page documented the command that prints the header and never showed the header, so a
closed-book reader could not answer "What column order does the CSV import template use?" — the
finding in [docs#83](https://github.com/trajectonomics/docs/issues/83), one of nine the 2026-11-17 QA
pass filed against this repository's command pages.

A page therefore shows an output it documents in a code block of its own, beside the command and
never merged into it: a reader copies the file, not a transcript of two things at once. That is
practice already, not a new decision — the commands page shows the error envelope the same way.
What is new is the check.

A page bound to an upstream wire contract is kept by a built-page check: `verify:build` compares the
built page against an exported constant, copied from the upstream ADR at the tag
`docs-sync-manifest.json` records, and fails with one stable code when the page stops showing it as
code. The `tx` page is the first, kept by `IMPORT_TEMPLATE_NOT_SHOWN`.

Two consequences are the reason this needs writing down:

- **The constant is a copy.** `bun run check` is offline and deterministic (AGENTS.md rule 3), and
  docs ADR 0002 refuses a build that reads an Upstream Package, so nothing here can read `cli` at
  build time. Docs Sync is the path that proposes the constant's update after an upstream release,
  exactly as it proposes the page's. The QA pass reports a page that contradicts the release in the
  meantime.
- **This is the first content-truth check.** Every other built-page check asserts the shell's
  structure — that a page exists, that the header mark links, that the Theme is dark. This one
  asserts what a page says. It is the same habit docs ADR 0002's amendment records for
  `release-truth`, which fails a page that names a release other than the manifest's, and it is
  deliberately narrow: a wire contract a reader must reproduce literally, not prose a reviewer can
  judge.

## Considered options

- **Read `cli` at build time and compare against it.** No drift, but it makes the Docs Portal's
  build depend on another repository and breaks the offline, deterministic check AGENTS.md rule 3
  requires; docs ADR 0002 already rejected it for content.
- **Assert only that the page has a code block.** Cheap, and useless: the page had a code block on
  the day the finding was filed.
- **Put the check in the content tree, over the MDX source.** A lower seam. It proves the source
  says the header, not that the reader sees it — and the defect lived in the rendered page, where
  the highlighter splits a line into `<span>`s.
- **Rely on review.** Nine findings from one QA pass say review does not see a page that shows a
  command and not its result.

## Consequences

- The header appears once in the page's code blocks and once in the check's constant; changing
  either alone turns one of them red or wrong, which is the point.
- A new page bound to an upstream contract follows this shape rather than inventing another: one
  check module, one exported constant, one failure code, registered in the built-page check set.
- The check reads code-block text with tags stripped, so a highlighted line still matches; a header
  that appears only in prose does not, and a build that produced no page fails with a message that
  says so rather than a second code for the same rule.
