import { DOCS_INDEX_PATH } from "../tabs"
import type { BuiltFile } from "./built-files"
import type { BuildFailure } from "./failures"
import { buildFailure } from "./failures"
import { tagAttribute } from "./html"
import { readerPages } from "./reader-pages"
import { sitePath } from "./site-path"

/** An `<a>` start tag of a built page, with the offset the pointer check compares. */
const ANCHOR_TAG = /<a\b([^>]*)>/gi

/** The start of the page's content, marked by its first level-one heading. */
const CONTENT = /<h1\b/i

/**
 * The parts of a page `afdocs` removes before it looks for a pointer to `llms.txt`: a pointer
 * inside one of them is a pointer no checking Agent reads (afdocs 0.23.0, `llms-txt-directive-html`).
 */
const UNREAD_ELEMENTS = [
	/<nav\b[\s\S]*?<\/nav>/gi,
	/<script\b[\s\S]*?<\/script>/gi,
	/<style\b[\s\S]*?<\/style>/gi,
]

/** The page as an Agent reads it: without its navigation, its scripts and its styles. */
function readableHtml(html: string): string {
	return UNREAD_ELEMENTS.reduce((rest, element) => rest.replace(element, ""), html)
}

/** The offset of the first link to the Docs index, which is the page's agent pointer. */
function pointerOffset(html: string): number | undefined {
	for (const match of html.matchAll(ANCHOR_TAG)) {
		const href = tagAttribute(match[1] ?? "", "href")
		if (href !== undefined && sitePath(href) === DOCS_INDEX_PATH) return match.index
	}
	return undefined
}

/** The offset where the page's content starts. */
function contentOffset(html: string): number | undefined {
	return CONTENT.exec(html)?.index
}

/**
 * Failures for a page with no pointer to the Docs index in what an Agent reads, or one that sits
 * after its content. The pointer is invisible to a reader, so the build is the only place its
 * presence and its position are held.
 */
export function checkAgentPointers(files: readonly BuiltFile[]): readonly BuildFailure[] {
	return readerPages(files).flatMap(({ file }) => {
		const html = readableHtml(file.content)
		const pointer = pointerOffset(html)
		if (pointer === undefined) {
			return [
				buildFailure(
					"AGENT_POINTER_MISSING",
					file.path,
					"the page carries no pointer to the Docs index outside its <nav>, script and style elements",
				),
			]
		}
		const content = contentOffset(html)
		if (content === undefined) {
			return [
				buildFailure(
					"AGENT_CONTENT_MISSING",
					file.path,
					"the page has no content heading to place the pointer before",
				),
			]
		}
		return pointer > content
			? [
					buildFailure(
						"AGENT_POINTER_AFTER_CONTENT",
						file.path,
						"the pointer to the Docs index sits after the page's content",
					),
				]
			: []
	})
}
