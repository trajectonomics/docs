import { describe, expect, test } from "bun:test"
import { absoluteDocsLinks } from "./absolute-links"

const ORIGIN = "https://trajectonomics.com"

describe("the links in a Markdown twin", () => {
	test.each([
		[
			"[Commands](/docs/cli/commands/)",
			"[Commands](https://trajectonomics.com/docs/cli/commands/)",
		],
		[
			'[tx](/docs/cli/commands/tx/?a=1#flags "The tx page")',
			'[tx](https://trajectonomics.com/docs/cli/commands/tx/?a=1#flags "The tx page")',
		],
		["[Docs](/docs/)", "[Docs](https://trajectonomics.com/docs/)"],
	])("an internal link is made absolute: %s", (content, expected) => {
		expect(absoluteDocsLinks(content, ORIGIN)).toBe(expected)
	})

	test("an external link is untouched", () => {
		const content = "[ledger](https://www.npmjs.com/package/@trajectonomics/ledger)"
		expect(absoluteDocsLinks(content, ORIGIN)).toBe(content)
	})

	test("a link already absolute is left as it is", () => {
		const content = "[tx](https://trajectonomics.com/docs/cli/commands/tx.md)"
		expect(absoluteDocsLinks(content, ORIGIN)).toBe(content)
	})
})
