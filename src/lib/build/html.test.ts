import { describe, expect, test } from "bun:test"
import { anchors, elementContent } from "./html"

const PAGE = [
	'<header id="nd-subnav" class="x">',
	'<a href="/docs/cli/" aria-current="page">CLI &amp; Quickstart</a>',
	'<a href="/docs/developers/"><span>Build</span> on Trajectonomics</a>',
	"</header>",
	'<main><a href="/docs/other/">Other</a></main>',
].join("")

describe("the element of an HTML fragment found by id", () => {
	test("returns the content of the element with the id, without the rest of the page", () => {
		expect(elementContent(PAGE, "nd-subnav")).toBe(
			'<a href="/docs/cli/" aria-current="page">CLI &amp; Quickstart</a>' +
				'<a href="/docs/developers/"><span>Build</span> on Trajectonomics</a>',
		)
	})

	test("keeps the content of a same-named element nested inside", () => {
		expect(elementContent('<div id="a"><div>inner</div></div>', "a")).toBe("<div>inner</div>")
	})

	test("returns undefined when no element has the id", () => {
		expect(elementContent(PAGE, "nd-sidebar")).toBeUndefined()
	})

	test("finds the id among other attributes, in any order", () => {
		expect(
			elementContent(
				'<aside class="x" id="nd-sidebar" data-open="false">tree</aside>',
				"nd-sidebar",
			),
		).toBe("tree")
	})
})

describe("the links of an HTML fragment", () => {
	test("reads the href, the aria-current and the text of every link", () => {
		expect(anchors(PAGE)).toEqual([
			{ href: "/docs/cli/", ariaCurrent: "page", text: "CLI & Quickstart" },
			{ href: "/docs/developers/", ariaCurrent: undefined, text: "Build on Trajectonomics" },
			{ href: "/docs/other/", ariaCurrent: undefined, text: "Other" },
		])
	})

	test("a link without the attributes the checks read is still a link", () => {
		expect(anchors("<a>bare</a>")).toEqual([
			{ href: undefined, ariaCurrent: undefined, text: "bare" },
		])
	})
})
