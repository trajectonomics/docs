import { NOT_FOUND_BODY_ID } from "../not-found"
import { DOCS_BASE_PATH } from "../tabs"
import type { BuiltFile } from "./built-files"
import { fileAt } from "./built-files"
import type { BuildFailure } from "./failures"
import { buildFailure } from "./failures"
import { anchors, elementContent } from "./html"

/** Assets-root path of the built 404 page. */
export const NOT_FOUND_PAGE_FILE = `${DOCS_BASE_PATH.slice(1)}/404.html`

/** The header the home layout renders, which holds the search trigger. */
const HEADER_ID = "nd-nav"

/** A Fumadocs search control: the desktop field or the small-screen button. */
const SEARCH_TRIGGER = /data-search(?:-full)?=/

/** The Landing Page, where a reader who mistyped a URL should be sent. */
const LANDING_URL = `${DOCS_BASE_PATH}/`

function shellFailures(page: BuiltFile): readonly BuildFailure[] {
	const header = elementContent(page.content, HEADER_ID)
	if (header === undefined) {
		return [
			buildFailure("NOT_FOUND_HEADER_MISSING", page.path, "the 404 page has no Docs Portal header"),
		]
	}
	if (SEARCH_TRIGGER.test(header)) return []
	return [
		buildFailure("NOT_FOUND_SEARCH_MISSING", page.path, "the 404 header has no search trigger"),
	]
}

function wayBackFailures(page: BuiltFile): readonly BuildFailure[] {
	const body = elementContent(page.content, NOT_FOUND_BODY_ID) ?? ""
	if (anchors(body).some((link) => link.href === LANDING_URL)) return []
	return [
		buildFailure("NOT_FOUND_LINK_MISSING", page.path, `the 404 body has no link to ${LANDING_URL}`),
	]
}

/** Failures for a 404 page that lacks the shell header, its search, or a way back to the Landing Page. */
export function checkNotFoundPage(files: readonly BuiltFile[]): readonly BuildFailure[] {
	const page = fileAt(files, NOT_FOUND_PAGE_FILE)
	return page === undefined ? [] : [...shellFailures(page), ...wayBackFailures(page)]
}
