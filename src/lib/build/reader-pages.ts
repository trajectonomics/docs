import { twinPath } from "../agent/twin-path"
import { DOCS_BASE_PATH } from "../tabs"
import type { BuiltFile } from "./built-files"
import { builtPageSlug } from "./built-files"
import { isRedirectPage } from "./redirect-page"

/** One built page a reader can open, with the twin URL path its Markdown form must have. */
export interface ReaderPage {
	readonly file: BuiltFile
	readonly url: string
	readonly twin: string
}

/** The URL path of a built page, or `undefined` for a file that is not a page of the Portal. */
function pageUrl(path: string): string | undefined {
	const slug = builtPageSlug(path)
	if (slug === undefined) return undefined
	return slug.length === 0 ? `${DOCS_BASE_PATH}/` : `${DOCS_BASE_PATH}/${slug}/`
}

/**
 * Every built page a reader can open: each page with a twin, never a redirect stub and never the
 * 404 page, which has no Markdown form.
 */
export function readerPages(files: readonly BuiltFile[]): readonly ReaderPage[] {
	return Object.freeze(
		files.flatMap((file) => {
			const url = pageUrl(file.path)
			if (url === undefined || isRedirectPage(file.content)) return []
			return [Object.freeze({ file, url, twin: twinPath(url) })]
		}),
	)
}
