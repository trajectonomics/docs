import { describe, expect, test } from "bun:test"
import type { BuiltFile } from "./built-files"
import { checkTheme } from "./theme"

const PAGE = "docs/cli/index.html"

/** A built page whose `<html>` carries `attributes` and whose body is `body`. */
function page(attributes = ' data-theme="dark"', body = ""): BuiltFile {
	return { path: PAGE, content: `<!doctype html><html${attributes}><body>${body}</body></html>` }
}

function codesOf(files: readonly BuiltFile[]): readonly string[] {
	return checkTheme(files).map((failure) => failure.code)
}

describe("the Theme of a built page", () => {
	test("a page that declares the dark Theme and offers no toggle reports no failure", () => {
		expect(codesOf([page()])).toEqual([])
	})

	test("a page whose <html> leaves out the dark Theme is reported as THEME_NOT_DARK", () => {
		expect(codesOf([page(' lang="en"')])).toEqual(["THEME_NOT_DARK"])
		expect(codesOf([page(' data-theme="light"')])).toEqual(["THEME_NOT_DARK"])
	})

	test("a document without an <html> element is reported as THEME_NOT_DARK", () => {
		expect(codesOf([{ path: PAGE, content: "<!doctype html><title>A page</title>" }])).toEqual([
			"THEME_NOT_DARK",
		])
	})

	test("a page whose <html> carries the light class is reported as THEME_LIGHT_CLASS", () => {
		expect(codesOf([page(' data-theme="dark" class="light"')])).toEqual(["THEME_LIGHT_CLASS"])
		const withOthers = page(' data-theme="dark" class="scroll-smooth light"')
		expect(codesOf([withOthers])).toEqual(["THEME_LIGHT_CLASS"])
	})

	test("a light class outside <html> is not the Theme and reports no failure", () => {
		expect(codesOf([page(undefined, '<div class="light"></div>')])).toEqual([])
	})

	test("a page that still renders the theme toggle is reported as THEME_TOGGLE_PRESENT", () => {
		expect(codesOf([page(undefined, "<button data-theme-toggle></button>")])).toEqual([
			"THEME_TOGGLE_PRESENT",
		])
	})

	test("a non-HTML build file is ignored", () => {
		expect(codesOf([{ path: "docs/api/search.json", content: '{"theme":"light"}' }])).toEqual([])
	})

	test("each failure names the page it comes from", () => {
		const failures = checkTheme([page(' data-theme="light" class="light"')])
		expect(failures.map((failure) => failure.path)).toEqual([PAGE, PAGE])
	})
})

describe("a built redirect stub", () => {
	const STUB = "docs/operators/index.html"

	test("is not a page, so it carries no Theme and is not reported", () => {
		const stub: BuiltFile = {
			path: STUB,
			content:
				'<!doctype html><title>Redirecting to: /docs/cli/</title><meta http-equiv="refresh" content="0;url=/docs/cli/">',
		}
		expect(checkTheme([stub])).toEqual([])
	})
})
