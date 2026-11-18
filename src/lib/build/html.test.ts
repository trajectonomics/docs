import { describe, expect, test } from "bun:test"
import { anchors, elementContent, linkName, visibleText } from "./html"

const PAGE = [
	'<header id="nd-subnav" class="x">',
	'<a href="/docs/cli/" aria-current="page">CLI &amp; Quickstart</a>',
	'<a href="/docs/developers/"><span>Build</span> on Trajectonomics</a>',
	"</header>",
	'<main><a href="/docs/other/">Other</a></main>',
].join("")

describe("the visible text of an HTML fragment", () => {
	test("drops the tags and decodes the entities a highlighted code block carries", () => {
		expect(visibleText("<span>PATH</span><span>=</span><span>&quot;$HOME</span>")).toBe(
			'PATH = "$HOME',
		)
	})

	test("collapses the whitespace the dropped tags leave behind", () => {
		expect(visibleText("<span> a </span>\n<span> b </span>")).toBe("a b")
	})
})

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
			{
				href: "/docs/cli/",
				ariaCurrent: "page",
				ariaLabel: undefined,
				text: "CLI & Quickstart",
			},
			{
				href: "/docs/developers/",
				ariaCurrent: undefined,
				ariaLabel: undefined,
				text: "Build on Trajectonomics",
			},
			{
				href: "/docs/other/",
				ariaCurrent: undefined,
				ariaLabel: undefined,
				text: "Other",
			},
		])
	})

	test("a link without the attributes the checks read is still a link", () => {
		expect(anchors("<a>bare</a>")).toEqual([
			{ href: undefined, ariaCurrent: undefined, ariaLabel: undefined, text: "bare" },
		])
	})

	test("reads the aria-label a link names itself with", () => {
		expect(anchors('<a href="/docs/" aria-label="Trajectonomics Docs"><svg></svg></a>')).toEqual([
			{ href: "/docs/", ariaCurrent: undefined, ariaLabel: "Trajectonomics Docs", text: "" },
		])
	})
})

describe("the name a link is read aloud with", () => {
	test("a link that names itself is read with its aria-label, not its artwork", () => {
		const [link] = anchors('<a href="/docs/" aria-label="Trajectonomics Docs"><svg></svg></a>')
		expect(link === undefined ? undefined : linkName(link)).toBe("Trajectonomics Docs")
	})

	test("a link without an aria-label is read with its text", () => {
		const [link] = anchors('<a href="/docs/">Trajectonomics Docs</a>')
		expect(link === undefined ? undefined : linkName(link)).toBe("Trajectonomics Docs")
	})
})
