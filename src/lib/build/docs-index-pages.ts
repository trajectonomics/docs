import type { BuiltFile } from "./built-files"
import { fileAt } from "./built-files"
import { DOCS_INDEX_FILE, parseDocsIndex } from "./docs-index-file"
import { duplicates } from "./duplicates"
import type { BuildFailure } from "./failures"
import { buildFailure } from "./failures"
import { readerPages } from "./reader-pages"

/** The twin paths a list of index entries names, in the order the index lists them. */
function listedTwins(twins: readonly (string | undefined)[]): readonly string[] {
	return twins.filter((twin): twin is string => twin !== undefined)
}

/** Failures for a Docs index that omits a page, repeats an entry, or names no twin the build holds. */
export function checkDocsIndexPages(files: readonly BuiltFile[]): readonly BuildFailure[] {
	const file = fileAt(files, DOCS_INDEX_FILE)
	if (file === undefined) {
		return [
			buildFailure(
				"DOCS_INDEX_MISSING",
				DOCS_INDEX_FILE,
				"the build did not produce the Docs index",
			),
		]
	}
	const entries = parseDocsIndex(file.content)
	if (entries === undefined) {
		return [
			buildFailure(
				"DOCS_INDEX_INVALID",
				DOCS_INDEX_FILE,
				"the Docs index is not an llmstxt.org document this check can read",
			),
		]
	}
	const twins = listedTwins(entries.map((entry) => entry.twin))
	return [
		...entries
			.filter((entry) => entry.twin === undefined)
			.map((entry) =>
				buildFailure(
					"DOCS_INDEX_LINK_UNEXPECTED",
					DOCS_INDEX_FILE,
					`the Docs index lists ${entry.url}, which is not a Markdown twin on the Portal`,
				),
			),
		...duplicates(twins).map((twin) =>
			buildFailure(
				"DOCS_INDEX_PAGE_DUPLICATE",
				DOCS_INDEX_FILE,
				`the Docs index lists ${twin} more than once`,
			),
		),
		...readerPages(files)
			.filter((page) => !twins.includes(page.twin))
			.map((page) =>
				buildFailure(
					"DOCS_INDEX_PAGE_MISSING",
					DOCS_INDEX_FILE,
					`the Docs index does not list ${page.twin}, the twin of ${page.url}`,
				),
			),
		...twins
			.filter((twin) => fileAt(files, twin.slice(1)) === undefined)
			.map((twin) =>
				buildFailure(
					"TWIN_MISSING",
					DOCS_INDEX_FILE,
					`the Docs index lists ${twin}, but the build produced no twin there`,
				),
			),
	]
}
