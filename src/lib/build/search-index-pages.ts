import { DOCS_BASE_PATH, TABS } from "../tabs"
import type { BuiltFile } from "./built-files"
import { fileAt } from "./built-files"
import type { BuildFailure } from "./failures"
import { buildFailure } from "./failures"
import { indexedPageIds, parseSearchIndex, SEARCH_INDEX_FILE } from "./search-index"

const DOCS_DIR = DOCS_BASE_PATH.slice(1)

/** The URL path of a built content page under a Tab folder, or `undefined` for any other file. */
function contentPagePath(path: string): string | undefined {
	const prefix = `${DOCS_DIR}/`
	if (!path.startsWith(prefix) || !path.endsWith("/index.html")) return undefined
	const slug = path.slice(prefix.length, -"index.html".length).replace(/\/$/, "")
	const [folder] = slug.split("/")
	if (folder === undefined || !TABS.some((tab) => tab.folder === folder)) return undefined
	return `${DOCS_BASE_PATH}/${slug}`
}

/** The URL paths of the content pages the build produced under each Tab folder, sorted. */
function contentPagePaths(files: readonly BuiltFile[]): readonly string[] {
	const pages = files
		.map((file) => contentPagePath(file.path))
		.filter((page): page is string => page !== undefined)
	return pages.sort()
}

/** Failures for every built content page the search index has no page entry for. */
export function checkSearchIndexPages(files: readonly BuiltFile[]): readonly BuildFailure[] {
	const indexFile = fileAt(files, SEARCH_INDEX_FILE)
	if (indexFile === undefined) {
		return []
	}
	const index = parseSearchIndex(indexFile.content)
	if (index === undefined) {
		return []
	}
	const indexed = indexedPageIds(index)
	return contentPagePaths(files)
		.filter((page) => !indexed.has(page))
		.map((page) =>
			buildFailure(
				"SEARCH_INDEX_PAGE_MISSING",
				SEARCH_INDEX_FILE,
				`the search index has no page entry for ${page}`,
			),
		)
}
