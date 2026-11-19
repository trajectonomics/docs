import { describe, expect, test } from "bun:test"
import { acceptsMarkdown } from "./accepts-markdown"

// The header is read as a media type, not as a substring: `*/*` and `text/*` keep the HTML page
// and `q=0` refuses, so an Agent that asks for Markdown is the only one that gets it (ADR 0010).
const cases: readonly (readonly [string | null, boolean])[] = [
	[null, false],
	["text/html", false],
	["*/*", false],
	["text/*", false],
	["text/markdown", true],
	["TEXT/MARKDOWN", true],
	["text/markdown; charset=utf-8", true],
	["text/markdown;q=0.5", true],
	["text/markdown; q=1", true],
	["text/markdown;q=0", false],
	["text/markdown;q=0.000", false],
	["text/html, text/markdown;q=0.5", true],
	["text/html, text/markdown;q=0", false],
	["text/markdown;level=1;q=0", false],
	["text/markdown;q=nonsense", false],
	["text/markdownx", false],
]

describe("the Accept header asks for Markdown", () => {
	for (const [accept, expected] of cases) {
		test(`Accept: ${accept ?? "(none)"} asks for Markdown: ${expected}`, () => {
			expect(acceptsMarkdown(accept)).toBe(expected)
		})
	}
})
