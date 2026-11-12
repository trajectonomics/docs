import { describe, expect, test } from "bun:test"
import type { BuiltFile } from "./built-files"
import { checkNotFoundPage, NOT_FOUND_PAGE_FILE } from "./not-found"

const HEADER =
	'<header id="nd-nav"><button data-search-full=""></button><a href="/docs/">Trajectonomics Docs</a></header>'
const BODY =
	'<div id="portal-not-found"><h1>Page not found</h1><a href="/docs/">Docs Portal</a></div>'

function page(header: string, body: string): BuiltFile {
	return { path: NOT_FOUND_PAGE_FILE, content: `${header}${body}` }
}

function codesOf(files: readonly BuiltFile[]): readonly string[] {
	return checkNotFoundPage(files).map((failure) => failure.code)
}

describe("the 404 page of the built Docs Portal", () => {
	test("a 404 page with the shell header, its search and a link to the Landing Page reports no failure", () => {
		expect(codesOf([page(HEADER, BODY)])).toEqual([])
	})

	test("a 404 page with no shell header is reported as NOT_FOUND_HEADER_MISSING", () => {
		expect(codesOf([page("", BODY)])).toEqual(["NOT_FOUND_HEADER_MISSING"])
	})

	test("a header without a search trigger is reported as NOT_FOUND_SEARCH_MISSING", () => {
		expect(codesOf([page('<header id="nd-nav"></header>', BODY)])).toEqual([
			"NOT_FOUND_SEARCH_MISSING",
		])
	})

	test("the small-screen search button counts as the search trigger", () => {
		expect(
			codesOf([page('<header id="nd-nav"><button data-search=""></button></header>', BODY)]),
		).toEqual([])
	})

	test("a body whose only link is the Operator Tab is reported as NOT_FOUND_LINK_MISSING", () => {
		expect(codesOf([page(HEADER, BODY.replace("/docs/", "/docs/cli/"))])).toEqual([
			"NOT_FOUND_LINK_MISSING",
		])
	})

	test("a link to the Landing Page in the header does not count as the 404 body's way back", () => {
		expect(codesOf([page(HEADER, '<div id="portal-not-found">Page not found</div>')])).toEqual([
			"NOT_FOUND_LINK_MISSING",
		])
	})

	test("a build without a 404 page reports no failure here, because the required-pages check owns that rule", () => {
		expect(codesOf([{ path: "docs/index.html", content: "<main></main>" }])).toEqual([])
	})
})
