import { describe, expect, test } from "bun:test"
import type { BuiltFile } from "./built-files"
import { checkImportTemplate, IMPORT_TEMPLATE_HEADER } from "./import-template"

const PAGE = "docs/cli/commands/tx/index.html"

/** The header as the highlighter ships it: one line split into a `<span>` per token. */
const HIGHLIGHTED = [
	'<span class="line">',
	'<span style="--shiki-dark:#FFA657">date</span>',
	'<span style="--shiki-dark:#A5D6FF">,from</span>',
	'<span style="--shiki-dark:#A5D6FF">,to</span>',
	'<span style="--shiki-dark:#79C0FF">,amount</span>',
	'<span style="--shiki-dark:#A5D6FF">,memo</span>',
	'<span style="--shiki-dark:#A5D6FF">,external_ref</span>',
	'<span style="--shiki-dark:#A5D6FF">,project</span>',
	"</span>",
].join("")

function codesOf(files: readonly BuiltFile[]): readonly string[] {
	return checkImportTemplate(files).map((failure) => failure.code)
}

function page(content: string): BuiltFile {
	return { path: PAGE, content }
}

describe("the import template the tx page shows", () => {
	test("the header inside a code block reports no failure", () => {
		expect(codesOf([page(`<pre><code>${IMPORT_TEMPLATE_HEADER}</code></pre>`)])).toEqual([])
	})

	test("the header split into highlighted spans inside a code block reports no failure", () => {
		expect(codesOf([page(`<pre><code>${HIGHLIGHTED}</code></pre>`)])).toEqual([])
	})

	test("a header that appears only in prose is reported as IMPORT_TEMPLATE_NOT_SHOWN", () => {
		expect(codesOf([page(`<p>${IMPORT_TEMPLATE_HEADER}</p>`)])).toEqual([
			"IMPORT_TEMPLATE_NOT_SHOWN",
		])
	})

	test("a page with no header is reported as IMPORT_TEMPLATE_NOT_SHOWN", () => {
		expect(codesOf([page("<p>Import transactions from the one CSV template.</p>")])).toEqual([
			"IMPORT_TEMPLATE_NOT_SHOWN",
		])
	})

	test("a header on another page does not stand in for the tx page", () => {
		expect(
			codesOf([
				page("<p>Import transactions from the one CSV template.</p>"),
				{
					path: "docs/cli/index.html",
					content: `<pre><code>${IMPORT_TEMPLATE_HEADER}</code></pre>`,
				},
			]),
		).toEqual(["IMPORT_TEMPLATE_NOT_SHOWN"])
	})

	test("a build with no tx page is reported as IMPORT_TEMPLATE_NOT_SHOWN", () => {
		const [failure] = checkImportTemplate([])

		expect(failure?.code).toBe("IMPORT_TEMPLATE_NOT_SHOWN")
		expect(failure?.message).toContain("did not produce")
	})

	test("the header constant is the seven-column wire contract", () => {
		expect(IMPORT_TEMPLATE_HEADER).toBe("date,from,to,amount,memo,external_ref,project")
	})
})
