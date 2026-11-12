import { describe, expect, test } from "bun:test"
import { renderWorkerRedirects } from "../worker-redirects"
import type { BuiltFile } from "./built-files"
import { checkBuild } from "./index"

function page(path: string, content = "<!doctype html><title>A page</title>"): BuiltFile {
	return { path, content }
}

const OPERATOR_TAB_PAGE = [
	'<header id="nd-subnav">',
	'<a href="/docs/cli/" aria-current="page">CLI &amp; Quickstart</a>',
	'<a href="/docs/developers/">Build on Trajectonomics</a>',
	"</header>",
	'<aside id="nd-sidebar"><a href="/docs/cli/">Quickstart</a></aside>',
].join("")

const COMPLETE_BUILD: readonly BuiltFile[] = [
	page("docs/404.html"),
	page("docs/cli/index.html", OPERATOR_TAB_PAGE),
	{
		path: "docs/api/search.json",
		content: JSON.stringify({
			type: "advanced",
			internalDocumentIDStore: { internalIdToId: ["/docs/cli"] },
			docs: { docs: { "1": { page_id: "/docs/cli", type: "page" } } },
		}),
	},
	{ path: "_redirects", content: renderWorkerRedirects() },
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
			"REDIRECT_RULES_MISSING",
		])
	})
})
