import { describe, expect, test } from "bun:test"
import type { BuiltFile } from "./built-files"
import { checkLandingPage, LANDING_PAGE_FILE } from "./landing-page"
import { SEARCH_INDEX_FILE } from "./search-index"

const OPERATOR_LINK = '<a href="/docs/cli/">For Operators: install and run the CLI</a>'
const BUILDER_LINK =
	'<a href="/docs/developers/">For Builders: build on Trajectonomics packages</a>'

function landingPage(body: string, head = ""): BuiltFile {
	return {
		path: LANDING_PAGE_FILE,
		content: `<!doctype html><head><title>Docs</title>${head}</head><body>${body}</body>`,
	}
}

function searchIndex(pageIds: readonly string[]): BuiltFile {
	const docs = Object.fromEntries(
		pageIds.map((pageId, position) => [String(position), { page_id: pageId, type: "page" }]),
	)
	return {
		path: SEARCH_INDEX_FILE,
		content: JSON.stringify({
			type: "advanced",
			internalDocumentIDStore: { internalIdToId: pageIds },
			docs: { count: pageIds.length, docs },
		}),
	}
}

function codesOf(files: readonly BuiltFile[]): readonly string[] {
	return checkLandingPage(files).map((failure) => failure.code)
}

const TWO_ENTRIES = `<main>${OPERATOR_LINK}${BUILDER_LINK}</main>`

describe("the built Landing Page", () => {
	test("a page with one link to each Tab and no redirect reports no failure", () => {
		expect(codesOf([landingPage(TWO_ENTRIES), searchIndex(["/docs/cli"])])).toEqual([])
	})

	test("a page that is a meta refresh is reported as LANDING_PAGE_REDIRECT", () => {
		const stub = landingPage(TWO_ENTRIES, '<meta http-equiv="refresh" content="0;url=/docs/cli/">')

		expect(codesOf([stub])).toEqual(["LANDING_PAGE_REDIRECT"])
	})

	test("a page missing the link to a Tab is reported as LANDING_PAGE_LINKS", () => {
		expect(codesOf([landingPage(`<main>${OPERATOR_LINK}</main>`)])).toEqual(["LANDING_PAGE_LINKS"])
	})

	test("a page with a third link into a Tab is reported as LANDING_PAGE_LINKS", () => {
		const extra = '<a href="/docs/cli/installation/">Installation</a>'

		expect(codesOf([landingPage(`<main>${OPERATOR_LINK}${BUILDER_LINK}${extra}</main>`)])).toEqual([
			"LANDING_PAGE_LINKS",
		])
	})

	test("the same Tab linked twice is reported as LANDING_PAGE_LINKS", () => {
		expect(codesOf([landingPage(`<main>${OPERATOR_LINK}${OPERATOR_LINK}</main>`)])).toEqual([
			"LANDING_PAGE_LINKS",
		])
	})

	test("links that are not into a Tab, such as the header title, do not count", () => {
		const title = '<a href="/docs/">Trajectonomics Docs</a>'

		expect(codesOf([landingPage(`<header>${title}</header>${TWO_ENTRIES}`)])).toEqual([])
	})

	test("a search index with an entry for /docs/ is reported as LANDING_PAGE_INDEXED", () => {
		expect(codesOf([landingPage(TWO_ENTRIES), searchIndex(["/docs/cli", "/docs/"])])).toEqual([
			"LANDING_PAGE_INDEXED",
		])
	})

	test("a search index with an entry for /docs is reported as LANDING_PAGE_INDEXED", () => {
		expect(codesOf([landingPage(TWO_ENTRIES), searchIndex(["/docs"])])).toEqual([
			"LANDING_PAGE_INDEXED",
		])
	})

	test("a missing page is left to the required-pages check", () => {
		expect(codesOf([searchIndex(["/docs/cli"])])).toEqual([])
	})
})
