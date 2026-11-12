import { describe, expect, test } from "bun:test"
import type { BuiltFile } from "./built-files"
import { checkRequiredPages } from "./required-pages"

const NOT_FOUND_PAGE = "docs/404.html"
const LANDING_PAGE = "docs/index.html"
const OPERATOR_TAB_PAGE = "docs/cli/index.html"

function page(path: string): BuiltFile {
	return { path, content: "<!doctype html><title>A page</title>" }
}

function codesOf(files: readonly BuiltFile[]): readonly string[] {
	return checkRequiredPages(files).map((failure) => failure.code)
}

describe("required pages of the built Docs Portal", () => {
	test("a build that produced every required page reports no failure", () => {
		expect(codesOf([NOT_FOUND_PAGE, LANDING_PAGE, OPERATOR_TAB_PAGE].map(page))).toEqual([])
	})

	test("a build with no 404 page is reported as NOT_FOUND_PAGE_MISSING", () => {
		expect(codesOf([LANDING_PAGE, OPERATOR_TAB_PAGE].map(page))).toEqual(["NOT_FOUND_PAGE_MISSING"])
	})

	test("a build with no Landing Page is reported as LANDING_PAGE_MISSING", () => {
		expect(codesOf([NOT_FOUND_PAGE, OPERATOR_TAB_PAGE].map(page))).toEqual(["LANDING_PAGE_MISSING"])
	})

	test("a build with no Operator Tab page is reported as OPERATOR_TAB_PAGE_MISSING", () => {
		expect(codesOf([NOT_FOUND_PAGE, LANDING_PAGE].map(page))).toEqual(["OPERATOR_TAB_PAGE_MISSING"])
	})

	test("a build with no required page reports every failure, not only the first", () => {
		expect(codesOf([])).toEqual([
			"NOT_FOUND_PAGE_MISSING",
			"LANDING_PAGE_MISSING",
			"OPERATOR_TAB_PAGE_MISSING",
		])
	})
})
