import { PORTAL_NAME } from "../portal"
import { DOCS_BASE_PATH } from "../tabs"
import type { BuiltFile } from "./built-files"
import type { BuildFailure } from "./failures"
import { buildFailure } from "./failures"
import { anchors, elementContent, linkName } from "./html"
import { isRedirectPage } from "./redirect-page"

/** The headers Fumadocs renders, one per layout: the home layout's and the notebook layout's. */
const HEADER_IDS = ["nd-nav", "nd-subnav"] as const

/** The Landing Page, the one destination the header mark takes on every page (docs#75). */
const LANDING_PAGE_URL = `${DOCS_BASE_PATH}/`

/** The content of the header of whichever layout the page uses, or `undefined` when it has none. */
function headerContent(html: string): string | undefined {
	for (const id of HEADER_IDS) {
		const content = elementContent(html, id)
		if (content !== undefined) return content
	}
	return undefined
}

function markFailures(page: BuiltFile): readonly BuildFailure[] {
	const header = headerContent(page.content)
	if (header === undefined) {
		return [buildFailure("HEADER_MARK_LINK", page.path, "the page has no Docs Portal header")]
	}
	const marks = anchors(header).filter((link) => link.href === LANDING_PAGE_URL)
	if (marks.length !== 1) {
		return [
			buildFailure(
				"HEADER_MARK_LINK",
				page.path,
				`the header links to ${LANDING_PAGE_URL} ${marks.length} times, expected once`,
			),
		]
	}
	const mark = marks[0]
	const name = mark === undefined ? "" : linkName(mark)
	if (name !== PORTAL_NAME) {
		return [
			buildFailure(
				"HEADER_MARK_NAME",
				page.path,
				`the header mark is read as "${name}", expected "${PORTAL_NAME}"`,
			),
		]
	}
	return []
}

/** Failures for a built page whose header carries no mark, more than one, or a differently named one. */
export function checkHeaderMark(files: readonly BuiltFile[]): readonly BuildFailure[] {
	return files
		.filter((file) => file.path.endsWith(".html") && !isRedirectPage(file.content))
		.flatMap(markFailures)
}
