import { describe, expect, test } from "bun:test"
import { TABS, type TabDefinition, tabUrl } from "../tabs"
import type { BuiltFile } from "./built-files"
import { checkHeaderTabs } from "./header-tabs"

const OPERATOR = TABS[0]
const BUILDER = TABS[1]
const OPERATOR_PAGE = "docs/cli/index.html"
const BUILDER_PAGE = "docs/developers/index.html"

/** A Tab link, marked as the current page only when it is `current`. */
function tabLink(tab: TabDefinition, current: TabDefinition | undefined): string {
	const marked = tab === current ? ' aria-current="page"' : ""
	return `<a href="${tabUrl(tab)}"${marked}>${tab.audience}</a>`
}

/** A page whose header has both Tabs, with `current` marked. */
function page(path: string, current: TabDefinition | undefined): BuiltFile {
	return {
		path,
		content: `<header id="nd-subnav">${tabLink(OPERATOR, current)}${tabLink(BUILDER, current)}</header>`,
	}
}

function codesOf(files: readonly BuiltFile[]): readonly string[] {
	return checkHeaderTabs(files).map((failure) => failure.code)
}

describe("header Tabs of a built Tab page", () => {
	test("both Tab pages with both Tabs in the header report no failure", () => {
		expect(codesOf([page(OPERATOR_PAGE, OPERATOR), page(BUILDER_PAGE, BUILDER)])).toEqual([])
	})

	test("a header without a link to a Tab is reported as HEADER_TAB_LINK_MISSING", () => {
		const content = `<header id="nd-subnav">${tabLink(OPERATOR, OPERATOR)}</header>`
		expect(codesOf([{ path: OPERATOR_PAGE, content }])).toEqual(["HEADER_TAB_LINK_MISSING"])
	})

	test("a page without a header reports every missing Tab link", () => {
		expect(codesOf([{ path: OPERATOR_PAGE, content: "<main></main>" }])).toEqual([
			"HEADER_TAB_LINK_MISSING",
			"HEADER_TAB_LINK_MISSING",
		])
	})

	test("a current Tab without aria-current is reported as HEADER_TAB_NOT_CURRENT", () => {
		expect(codesOf([page(OPERATOR_PAGE, undefined)])).toEqual(["HEADER_TAB_NOT_CURRENT"])
	})

	test("a non-current Tab marked as current is reported as HEADER_TAB_OTHER_CURRENT", () => {
		const content = `<header id="nd-subnav">${tabLink(OPERATOR, undefined)}${tabLink(BUILDER, BUILDER)}</header>`
		expect(codesOf([{ path: OPERATOR_PAGE, content }])).toEqual([
			"HEADER_TAB_NOT_CURRENT",
			"HEADER_TAB_OTHER_CURRENT",
		])
	})

	test("Tab links outside the header do not count as header Tabs", () => {
		const content = [
			'<header id="nd-subnav"></header>',
			'<aside id="nd-sidebar">',
			tabLink(OPERATOR, OPERATOR),
			tabLink(BUILDER, OPERATOR),
			"</aside>",
		].join("")
		expect(codesOf([{ path: OPERATOR_PAGE, content }])).toEqual([
			"HEADER_TAB_LINK_MISSING",
			"HEADER_TAB_LINK_MISSING",
		])
	})

	test("a Tab page the build did not produce is left to the required-page check", () => {
		expect(codesOf([page(OPERATOR_PAGE, OPERATOR)])).toEqual([])
	})
})
