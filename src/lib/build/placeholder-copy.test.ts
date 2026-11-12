import { describe, expect, test } from "bun:test"
import type { BuiltFile } from "./built-files"
import { checkPlaceholderCopy } from "./placeholder-copy"

const PAGE = "docs/cli/index.html"

function codesOf(files: readonly BuiltFile[]): readonly string[] {
	return checkPlaceholderCopy(files).map((failure) => failure.code)
}

describe("the placeholder copy of built pages", () => {
	test("a page with real content reports no failure", () => {
		expect(codesOf([{ path: PAGE, content: "<main>The CLI is not released yet.</main>" }])).toEqual(
			[],
		)
	})

	test("a page that still shows the placeholder sentence is reported as PLACEHOLDER_COPY_PRESENT", () => {
		expect(codesOf([{ path: PAGE, content: "<main>This page is a placeholder.</main>" }])).toEqual([
			"PLACEHOLDER_COPY_PRESENT",
		])
	})

	test("every built page that shows the sentence is reported, not only the first", () => {
		const placeholder: BuiltFile = { path: PAGE, content: "This page is a placeholder." }
		const other: BuiltFile = {
			path: "docs/developers/index.html",
			content: "This page is a placeholder.",
		}

		expect(codesOf([placeholder, other])).toEqual([
			"PLACEHOLDER_COPY_PRESENT",
			"PLACEHOLDER_COPY_PRESENT",
		])
	})

	test("a non-HTML file that names the sentence is not a page", () => {
		expect(
			codesOf([{ path: "docs/api/search.json", content: '{"text":"This page is a placeholder"}' }]),
		).toEqual([])
	})
})
