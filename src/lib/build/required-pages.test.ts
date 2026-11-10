import { describe, expect, test } from "bun:test"
import type { BuiltFile } from "./built-files"
import { checkRequiredPages } from "./required-pages"

const NOT_FOUND_PAGE = "docs/404.html"
const OPERATOR_TAB_PAGE = "docs/cli/index.html"

function page(path: string): BuiltFile {
	return { path, content: "<!doctype html><title>A page</title>" }
}

function codesOf(files: readonly BuiltFile[]): readonly string[] {
	return checkRequiredPages(files).map((failure) => failure.code)
}

describe("required pages of the built Docs Portal", () => {
	test("a build that produced both required pages reports no failure", () => {
		expect(codesOf([page(NOT_FOUND_PAGE), page(OPERATOR_TAB_PAGE)])).toEqual([])
	})

	test("a build with no 404 page is reported as NOT_FOUND_PAGE_MISSING", () => {
		expect(codesOf([page(OPERATOR_TAB_PAGE)])).toEqual(["NOT_FOUND_PAGE_MISSING"])
	})

	test("a build with no Operator Tab page is reported as OPERATOR_TAB_PAGE_MISSING", () => {
		expect(codesOf([page(NOT_FOUND_PAGE)])).toEqual(["OPERATOR_TAB_PAGE_MISSING"])
	})

	test("a build with neither page reports both failures, not only the first", () => {
		expect(codesOf([])).toEqual(["NOT_FOUND_PAGE_MISSING", "OPERATOR_TAB_PAGE_MISSING"])
	})
})
