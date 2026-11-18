import { describe, expect, test } from "bun:test"
import { PORTAL_NAME } from "../portal"
import type { BuiltFile } from "./built-files"
import { checkHeaderMark } from "./header-mark"

const LANDING_PAGE_FILE = "docs/index.html"
const TAB_PAGE_FILE = "docs/cli/index.html"
const NOT_FOUND_PAGE_FILE = "docs/404.html"

/** The anchor Fumadocs renders for the header mark, in the layout whose header carries `id`. */
function mark(headerId: string, attributes: string, content = ""): string {
	return `<header id="${headerId}" aria-label="Main"><a href="/docs/" ${attributes}>${content}</a></header>`
}

/** The header of the home layout with the mark the Spec asks for. */
const HOME_HEADER = mark("nd-nav", `aria-label="${PORTAL_NAME}"`, "<svg aria-hidden='true'></svg>")

/** The header of the notebook layout with the same mark, so both layouts are checked. */
const NOTEBOOK_HEADER = mark("nd-subnav", `aria-label="${PORTAL_NAME}"`, "<svg></svg>")

function page(path: string, content: string): BuiltFile {
	return { path, content }
}

function codesOf(files: readonly BuiltFile[]): readonly string[] {
	return checkHeaderMark(files).map((failure) => failure.code)
}

describe("the header mark of a built page", () => {
	test("every layout whose header carries the mark named for the portal reports no failure", () => {
		const files = [
			page(LANDING_PAGE_FILE, HOME_HEADER),
			page(TAB_PAGE_FILE, NOTEBOOK_HEADER),
			page(NOT_FOUND_PAGE_FILE, HOME_HEADER),
		]
		expect(codesOf(files)).toEqual([])
	})

	test("a header with no link to the Landing Page is reported as HEADER_MARK_LINK", () => {
		const content = `<header id="nd-nav"><a href="/">trajectonomics.com</a></header>`
		expect(codesOf([page(LANDING_PAGE_FILE, content)])).toEqual(["HEADER_MARK_LINK"])
	})

	test("a header with two links to the Landing Page is reported as HEADER_MARK_LINK", () => {
		const content = `<header id="nd-nav"><a href="/docs/" aria-label="${PORTAL_NAME}"></a><a href="/docs/" aria-label="${PORTAL_NAME}"></a></header>`
		expect(codesOf([page(LANDING_PAGE_FILE, content)])).toEqual(["HEADER_MARK_LINK"])
	})

	test("a page without a Docs Portal header is reported as HEADER_MARK_LINK", () => {
		expect(codesOf([page(TAB_PAGE_FILE, "<main></main>")])).toEqual(["HEADER_MARK_LINK"])
	})

	test("a mark named something other than the portal is reported as HEADER_MARK_NAME", () => {
		const content = mark("nd-nav", 'aria-label="Trajectonomics"')
		expect(codesOf([page(LANDING_PAGE_FILE, content)])).toEqual(["HEADER_MARK_NAME"])
	})

	test("a mark named by its text instead of an aria-label is read with that text", () => {
		const content = mark("nd-nav", "", PORTAL_NAME)
		expect(codesOf([page(LANDING_PAGE_FILE, content)])).toEqual([])
	})

	test("a link to the Landing Page outside the header is not the mark", () => {
		const content = `${mark("nd-nav", `aria-label="${PORTAL_NAME}"`)}<main><a href="/docs/">Docs Portal</a></main>`
		expect(codesOf([page(NOT_FOUND_PAGE_FILE, content)])).toEqual([])
	})

	test("a redirect stub is never asked for a header", () => {
		const stub = '<meta http-equiv="refresh" content="0;url=/docs/cli/" /><main></main>'
		expect(codesOf([page("docs/quickstart/index.html", stub)])).toEqual([])
	})
})
