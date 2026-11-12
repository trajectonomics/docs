import { describe, expect, test } from "bun:test"
import type { BuiltFile } from "./built-files"
import { checkTocPlaceholder } from "./toc-placeholder"

const PAGE = "docs/cli/installation/index.html"

function codesOf(files: readonly BuiltFile[]): readonly string[] {
	return checkTocPlaceholder(files).map((failure) => failure.code)
}

describe("the table-of-contents column of built pages", () => {
	test("a page with no table of contents reports no failure", () => {
		expect(codesOf([{ path: PAGE, content: "<main>no headings</main>" }])).toEqual([])
	})

	test("a page with a real table of contents reports no failure", () => {
		expect(codesOf([{ path: PAGE, content: '<div id="nd-toc">On this page</div>' }])).toEqual([])
	})

	test("an empty table-of-contents placeholder is reported as TOC_PLACEHOLDER_PRESENT", () => {
		expect(codesOf([{ path: PAGE, content: '<div id="nd-toc-placeholder"></div>' }])).toEqual([
			"TOC_PLACEHOLDER_PRESENT",
		])
	})

	test("a non-HTML file that names the placeholder is not a page", () => {
		expect(
			codesOf([{ path: "docs/api/search.json", content: '{"id":"nd-toc-placeholder"}' }]),
		).toEqual([])
	})
})
