import { describe, expect, test } from "bun:test"
import type { BuiltFile } from "./built-files"
import { checkBuild } from "./index"

function page(path: string): BuiltFile {
	return { path, content: "<!doctype html><title>A page</title>" }
}

const COMPLETE_BUILD: readonly BuiltFile[] = [
	page("docs/404.html"),
	page("docs/cli/index.html"),
	{
		path: "docs/api/search.json",
		content: JSON.stringify({
			type: "advanced",
			internalDocumentIDStore: { internalIdToId: ["/docs/cli"] },
		}),
	},
]

describe("the check of the built Docs Portal", () => {
	test("a complete build reports no failure", () => {
		expect(checkBuild(COMPLETE_BUILD)).toEqual([])
	})

	test("a build that breaks several rules reports every failed rule, not only the first", () => {
		expect(checkBuild([]).map((failure) => failure.code)).toEqual([
			"NOT_FOUND_PAGE_MISSING",
			"OPERATOR_TAB_PAGE_MISSING",
			"SEARCH_INDEX_MISSING",
		])
	})
})
