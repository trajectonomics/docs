import { DOCS_BASE_PATH, isTabPath, TABS, tabUrl } from "../tabs"
import type { BuiltFile } from "./built-files"
import { fileAt } from "./built-files"
import type { BuildFailure } from "./failures"
import { buildFailure } from "./failures"
import { anchors } from "./html"
import { indexedPageIds, parseSearchIndex, SEARCH_INDEX_FILE } from "./search-index"

/** Assets-root path of the built Landing Page. */
export const LANDING_PAGE_FILE = `${DOCS_BASE_PATH.slice(1)}/index.html`

const META_REFRESH = /<meta\b[^>]*http-equiv="refresh"/i

/** The page ids the search index must not answer with: the Landing Page, with or without a slash. */
const LANDING_PAGE_IDS: readonly string[] = [DOCS_BASE_PATH, `${DOCS_BASE_PATH}/`]

function pageFailures(page: BuiltFile): readonly BuildFailure[] {
	if (META_REFRESH.test(page.content)) {
		return [buildFailure("LANDING_PAGE_REDIRECT", page.path, "the Landing Page is a meta refresh")]
	}
	const links = anchors(page.content)
		.map((link) => link.href)
		.filter(
			(href): href is string => href !== undefined && TABS.some((tab) => isTabPath(tab, href)),
		)
	const expected = TABS.map(tabUrl)
	if (links.length === expected.length && expected.every((url, at) => links[at] === url)) {
		return []
	}
	const found = links.length === 0 ? "none" : links.join(", ")
	return [
		buildFailure(
			"LANDING_PAGE_LINKS",
			page.path,
			`the Landing Page links to ${found} in the Tabs, expected exactly ${expected.join(", ")}`,
		),
	]
}

function indexFailures(files: readonly BuiltFile[]): readonly BuildFailure[] {
	const file = fileAt(files, SEARCH_INDEX_FILE)
	const index = file === undefined ? undefined : parseSearchIndex(file.content)
	if (index === undefined) return []
	const indexed = indexedPageIds(index)
	return LANDING_PAGE_IDS.filter((id) => indexed.has(id)).map((id) =>
		buildFailure(
			"LANDING_PAGE_INDEXED",
			SEARCH_INDEX_FILE,
			`the search index has an entry for the Landing Page (${id})`,
		),
	)
}

/** Failures for a Landing Page that redirects, links wrongly into the Tabs, or is searchable. */
export function checkLandingPage(files: readonly BuiltFile[]): readonly BuildFailure[] {
	const page = fileAt(files, LANDING_PAGE_FILE)
	return [...(page === undefined ? [] : pageFailures(page)), ...indexFailures(files)]
}
