import type { BuiltFile } from "./built-files"
import type { BuildFailure } from "./failures"
import { buildFailure } from "./failures"

/** The id Fumadocs gives the empty table-of-contents placeholder it renders for a page. */
const TOC_PLACEHOLDER_ID = "nd-toc-placeholder"

const PLACEHOLDER = `id="${TOC_PLACEHOLDER_ID}"`

/** Failures for built pages that reserve an empty table-of-contents column. */
export function checkTocPlaceholder(files: readonly BuiltFile[]): readonly BuildFailure[] {
	return files
		.filter((file) => file.path.endsWith(".html") && file.content.includes(PLACEHOLDER))
		.map((file) =>
			buildFailure(
				"TOC_PLACEHOLDER_PRESENT",
				file.path,
				"the page reserves an empty table-of-contents column",
			),
		)
}
