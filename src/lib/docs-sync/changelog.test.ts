import { describe, expect, test } from "bun:test"
import { parseChangelog } from "./changelog"

const RELEASE_NOTES = `## v0.2.0

### Added

- \`ledger accounts\` lists accounts
- Tax rate tables

### Changed

- \`ledger post\` now validates balances

### Fixed

- Rounding in \`tax compute\`

### Deprecated

- \`ledger post --force\`

### Removed

- \`ledger export --legacy\`
`

describe("changelog", () => {
	test("each release note entry is classified as an addition, a modification or a deprecation", () => {
		expect(parseChangelog(RELEASE_NOTES)).toEqual([
			{ kind: "addition", text: "`ledger accounts` lists accounts" },
			{ kind: "addition", text: "Tax rate tables" },
			{ kind: "modification", text: "`ledger post` now validates balances" },
			{ kind: "modification", text: "Rounding in `tax compute`" },
			{ kind: "deprecation", text: "`ledger post --force`" },
			{ kind: "deprecation", text: "`ledger export --legacy`" },
		])
	})

	test("a prose release body becomes one entry rather than one entry per line", () => {
		expect(parseChangelog("## v1.0.0\n\nInitial release. Includes the CLI.\n")).toEqual([
			{ kind: "other", text: "Initial release. Includes the CLI." },
		])
	})

	test("a heading on its own releases nothing to document", () => {
		expect(parseChangelog("## v1.0.0\n")).toEqual([])
		expect(parseChangelog("")).toEqual([])
	})

	test("asterisk bullets and unknown sections are still read", () => {
		expect(parseChangelog("### Notes\n* Use `sim run`\n")).toEqual([
			{ kind: "other", text: "Use `sim run`" },
		])
	})
})
