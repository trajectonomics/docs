import { describe, expect, test } from "bun:test"
import { absoluteDocsLinks } from "./absolute-links"

const ORIGIN = "https://trajectonomics.com"

describe("the links in a Markdown twin", () => {
	test("an internal link is made absolute", () => {
		expect(absoluteDocsLinks("[Commands](/docs/cli/commands/)", ORIGIN)).toBe(
			"[Commands](https://trajectonomics.com/docs/cli/commands/)",
		)
	})

	test("an internal link keeps its fragment, query and title", () => {
		expect(absoluteDocsLinks('[tx](/docs/cli/commands/tx/?a=1#flags "The tx page")', ORIGIN)).toBe(
			'[tx](https://trajectonomics.com/docs/cli/commands/tx/?a=1#flags "The tx page")',
		)
	})

	test("an external link is untouched", () => {
		const body = "[ledger](https://www.npmjs.com/package/@trajectonomics/ledger)"
		expect(absoluteDocsLinks(body, ORIGIN)).toBe(body)
	})

	test("a link to the Landing Page is made absolute", () => {
		expect(absoluteDocsLinks("[Docs](/docs/)", ORIGIN)).toBe(
			"[Docs](https://trajectonomics.com/docs/)",
		)
	})

	test("a link already absolute is left as it is", () => {
		const body = "[tx](https://trajectonomics.com/docs/cli/commands/tx.md)"
		expect(absoluteDocsLinks(body, ORIGIN)).toBe(body)
	})
})
