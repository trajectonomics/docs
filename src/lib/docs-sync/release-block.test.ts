import { describe, expect, test } from "bun:test"
import { renderReleaseBlock, upsertReleaseBlock } from "./release-block"

const RELEASE_URL = "https://github.com/trajectonomics/cli/releases/tag/v0.2.0"
const PAGE = `---
title: CLI & Quickstart
---

Install and run the Trajectonomics CLI.
`

const BLOCK = renderReleaseBlock({
	tag: "v0.2.0",
	releaseUrl: RELEASE_URL,
	entries: [
		{ kind: "addition", text: "`ledger accounts` lists accounts" },
		{ kind: "modification", text: "`ledger post` now validates balances" },
		{ kind: "deprecation", text: "`ledger post --force`" },
	],
})

describe("release notes block", () => {
	test("it names the release it was synced from and groups what changed", () => {
		expect(BLOCK).toContain("## Latest release: v0.2.0")
		expect(BLOCK).toContain(`[the v0.2.0 release](${RELEASE_URL})`)
		expect(BLOCK).toContain("### Added\n\n- `ledger accounts` lists accounts")
		expect(BLOCK).toContain("### Changed\n\n- `ledger post` now validates balances")
	})

	test("a deprecation is called out as something the reader must check", () => {
		expect(BLOCK).toContain("deprecated or removed in v0.2.0")
		expect(BLOCK).toContain("> - `ledger post --force`")
	})

	test("a page with no block keeps its authored text and gains the block after it", () => {
		const updated = upsertReleaseBlock(PAGE, BLOCK)
		expect(updated).toBe(`${PAGE}\n${BLOCK}\n`)
	})

	test("a later release replaces the block and leaves the authored text alone", () => {
		const now = upsertReleaseBlock(PAGE, BLOCK) ?? ""
		const next = upsertReleaseBlock(
			now,
			renderReleaseBlock({
				tag: "v0.3.0",
				releaseUrl: "https://github.com/trajectonomics/cli/releases/tag/v0.3.0",
				entries: [],
			}),
		)
		expect(next).toContain(PAGE)
		expect(next).not.toContain("v0.2.0")
		expect(next).toContain("## Latest release: v0.3.0")
	})

	test("writing the block it already carries proposes nothing", () => {
		const now = upsertReleaseBlock(PAGE, BLOCK) ?? ""
		expect(upsertReleaseBlock(now, BLOCK)).toBeNull()
	})
})
