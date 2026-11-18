import { describe, expect, test } from "bun:test"
import { SITE_ORIGIN } from "../site"
import type { BuiltFile } from "./built-files"
import { checkBuild } from "./index"

/** A built page around `content`, carrying the one Theme the Docs Portal ships. */
function page(
	path: string,
	content = '<!doctype html><html data-theme="dark"><title>A page</title></html>',
): BuiltFile {
	return { path, content }
}

const OPERATOR_TAB_PAGE = [
	'<html data-theme="dark">',
	'<header id="nd-subnav">',
	'<a href="/docs/" aria-label="Trajectonomics Docs"><svg aria-hidden="true"></svg></a>',
	'<a href="/docs/cli/" aria-current="page">CLI &amp; Quickstart</a>',
	'<a href="/docs/developers/">Build on Trajectonomics</a>',
	"</header>",
	'<aside id="nd-sidebar"><a href="/docs/cli/">Quickstart</a></aside>',
	"</html>",
].join("")

const RELEASE_LINE = "Docs synced from traj v0.2.0"

const LANDING_PAGE = [
	'<html data-theme="dark">',
	'<header id="nd-nav"><a href="/docs/" aria-label="Trajectonomics Docs"><svg></svg></a></header>',
	"<main>",
	'<a href="/docs/cli/">For Operators: install and run the CLI</a>',
	'<a href="/docs/developers/">For Builders: build on Trajectonomics packages</a>',
	`<p>${RELEASE_LINE}</p>`,
	"</main>",
	"</html>",
].join("")

const NOT_FOUND_PAGE = [
	'<html data-theme="dark">',
	'<header id="nd-nav">',
	'<a href="/docs/" aria-label="Trajectonomics Docs"><svg></svg></a>',
	'<button data-search-full=""></button>',
	"</header>",
	'<div id="portal-not-found"><h1>Page not found</h1><a href="/docs/">Docs Portal</a></div>',
	"</html>",
].join("")

/** A built redirect stub that sends the reader to `target`. */
function alias(path: string, target: string): BuiltFile {
	return {
		path,
		content: `<html><meta http-equiv="refresh" content="0;url=${target}"></html>`,
	}
}

const SITEMAP = [
	'<?xml version="1.0" encoding="UTF-8"?>',
	'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
	`  <url><loc>${SITE_ORIGIN}/docs/</loc></url>`,
	`  <url><loc>${SITE_ORIGIN}/docs/cli/</loc></url>`,
	`  <url><loc>${SITE_ORIGIN}/docs/cli/commands/tx/</loc></url>`,
	"</urlset>",
].join("\n")

const COMPLETE_BUILD: readonly BuiltFile[] = [
	page("docs/404.html", NOT_FOUND_PAGE),
	alias("docs/operators/index.html", "/docs/cli/"),
	alias("docs/builders/index.html", "/docs/developers/"),
	page("docs/index.html", LANDING_PAGE),
	page("docs/cli/index.html", OPERATOR_TAB_PAGE),
	page(
		"docs/cli/commands/tx/index.html",
		[
			'<html data-theme="dark">',
			'<header id="nd-subnav"><a href="/docs/" aria-label="Trajectonomics Docs"><svg></svg></a></header>',
			"<pre><code>date,from,to,amount,memo,external_ref,project</code></pre>",
			"</html>",
		].join(""),
	),
	{ path: "docs/sitemap.xml", content: SITEMAP },
	{
		path: "docs/api/search.json",
		content: JSON.stringify({
			type: "advanced",
			internalDocumentIDStore: {
				internalIdToId: ["/docs/cli", "/docs/cli/commands/tx"],
			},
			docs: {
				docs: {
					"1": { page_id: "/docs/cli", type: "page" },
					"2": { page_id: "/docs/cli/commands/tx", type: "page" },
				},
			},
		}),
	},
]

describe("the check of the built Docs Portal", () => {
	test("a complete build reports no failure", () => {
		expect(checkBuild(COMPLETE_BUILD, RELEASE_LINE)).toEqual([])
	})

	test("a build whose Installation page shows no copyable PATH line reports that rule", () => {
		const withoutLine = page(
			"docs/cli/installation/index.html",
			'<html data-theme="dark"><main><p>Add ~/.local/bin to your PATH.</p></main></html>',
		)
		const codes = checkBuild([...COMPLETE_BUILD, withoutLine], RELEASE_LINE).map(
			(failure) => failure.code,
		)

		expect(codes).toContain("INSTALLATION_PAGE_PATH_LINE_MISSING")
	})

	test("a build that breaks several rules reports every failed rule, not only the first", () => {
		const stale: BuiltFile = { path: "_redirects", content: "/docs /docs/cli/ 302\n" }

		expect(checkBuild([stale], RELEASE_LINE).map((failure) => failure.code)).toEqual([
			"NOT_FOUND_PAGE_MISSING",
			"LANDING_PAGE_MISSING",
			"OPERATOR_TAB_PAGE_MISSING",
			"SEARCH_INDEX_MISSING",
			"SITEMAP_MISSING",
			"REDIRECT_TO_OPERATOR_TAB",
			"TAB_ALIAS_MISSING",
			"TAB_ALIAS_MISSING",
			"IMPORT_TEMPLATE_NOT_SHOWN",
		])
	})
})
