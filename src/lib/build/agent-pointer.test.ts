import { describe, expect, test } from "bun:test"
import { SITE_ORIGIN } from "../site"
import { checkAgentPointers } from "./agent-pointer"
import type { BuiltFile } from "./built-files"

/** The pointer line every page with a twin carries before its content. */
const POINTER =
	'<p>For AI agents: <a href="/docs/cli.md">Markdown</a> · <a href="/docs/llms.txt">Docs index</a></p>'

/** One built page with a twin, its pointer and its content. */
function page(path: string, body: string): BuiltFile {
	return { path, content: `<html><body>${body}</body></html>` }
}

describe("the agent pointer of a built page", () => {
	test("a pointer before the page's content reports no failure", () => {
		const files = [page("docs/cli/index.html", `${POINTER}<main><h1>Quickstart</h1></main>`)]

		expect(checkAgentPointers(files)).toEqual([])
	})

	test("a page with no pointer to the Docs index is reported as AGENT_POINTER_MISSING", () => {
		const files = [page("docs/cli/index.html", "<main><h1>Quickstart</h1></main>")]

		expect(checkAgentPointers(files).map((failure) => failure.code)).toEqual([
			"AGENT_POINTER_MISSING",
		])
	})

	test("a pointer after the page's content is reported as AGENT_POINTER_AFTER_CONTENT", () => {
		const files = [page("docs/cli/index.html", `<main><h1>Quickstart</h1></main>${POINTER}`)]

		expect(checkAgentPointers(files).map((failure) => failure.code)).toEqual([
			"AGENT_POINTER_AFTER_CONTENT",
		])
	})

	test("a page with no content heading is reported as AGENT_CONTENT_MISSING", () => {
		const files = [page("docs/cli/index.html", POINTER)]

		expect(checkAgentPointers(files).map((failure) => failure.code)).toEqual([
			"AGENT_CONTENT_MISSING",
		])
	})

	test("an absolute link to the index is the same pointer", () => {
		const absolute = POINTER.replace("/docs/llms.txt", `${SITE_ORIGIN}/docs/llms.txt`)
		const files = [page("docs/cli/index.html", `${absolute}<main><h1>Quickstart</h1></main>`)]

		expect(checkAgentPointers(files)).toEqual([])
	})

	test("the 404 page and the audience aliases have no twin and carry no pointer", () => {
		const files: readonly BuiltFile[] = [
			page("docs/cli/index.html", `${POINTER}<main><h1>Quickstart</h1></main>`),
			{ path: "docs/404.html", content: "<html><body><h1>Page not found</h1></body></html>" },
			{
				path: "docs/operators/index.html",
				content: '<html><meta http-equiv="refresh" content="0;url=/docs/cli/"></html>',
			},
		]

		expect(checkAgentPointers(files)).toEqual([])
	})
})
