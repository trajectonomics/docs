import { describe, expect, test } from "bun:test"
import type { BuiltFile } from "./built-files"
import { checkSearchIndex, SEARCH_INDEX_FILE } from "./search-index"

function searchIndexFile(content: string): BuiltFile {
	return { path: SEARCH_INDEX_FILE, content }
}

function exportedIndex(documentIds: readonly string[]): string {
	return JSON.stringify({
		type: "advanced",
		internalDocumentIDStore: { internalIdToId: documentIds },
	})
}

function codesOf(files: readonly BuiltFile[]): readonly string[] {
	return checkSearchIndex(files).map((failure) => failure.code)
}

describe("the search index of the built Docs Portal", () => {
	test("an index that exported at least one entry reports no failure", () => {
		expect(codesOf([searchIndexFile(exportedIndex(["/docs/cli"]))])).toEqual([])
	})

	test("a build with no search index is reported as SEARCH_INDEX_MISSING", () => {
		expect(codesOf([])).toEqual(["SEARCH_INDEX_MISSING"])
	})

	test("an index that is not valid JSON is reported as SEARCH_INDEX_INVALID", () => {
		expect(codesOf([searchIndexFile("not json")])).toEqual(["SEARCH_INDEX_INVALID"])
	})

	test("an index that is not an exported advanced index is reported as SEARCH_INDEX_INVALID", () => {
		expect(codesOf([searchIndexFile(JSON.stringify({ entries: [] }))])).toEqual([
			"SEARCH_INDEX_INVALID",
		])
	})

	test("an index that exported no entry is reported as SEARCH_INDEX_EMPTY", () => {
		expect(codesOf([searchIndexFile(exportedIndex([]))])).toEqual(["SEARCH_INDEX_EMPTY"])
	})
})
