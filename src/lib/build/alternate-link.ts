import type { BuiltFile } from "./built-files"
import type { BuildFailure } from "./failures"
import { buildFailure } from "./failures"
import { tagAttribute } from "./html"
import { readerPages } from "./reader-pages"
import { sitePath } from "./site-path"

/** The head of a built page, where its alternate Markdown link belongs. */
const HEAD = /<head\b[^>]*>([\s\S]*?)<\/head>/i

/** A `<link>` start tag of a built page. */
const LINK_TAG = /<link\b([^>]*)>/gi

/** The twin paths the alternate Markdown links in a page's head name. */
function alternateTwinPaths(html: string): readonly string[] {
	const head = HEAD.exec(html)?.[1] ?? ""
	return [...head.matchAll(LINK_TAG)].flatMap((match) => {
		const attributes = match[1] ?? ""
		const rel = tagAttribute(attributes, "rel")?.split(/\s+/) ?? []
		const type = tagAttribute(attributes, "type")?.split(";")[0]?.trim()
		const href = tagAttribute(attributes, "href")
		if (!rel.includes("alternate") || type !== "text/markdown" || href === undefined) return []
		const path = sitePath(href)
		return path === undefined ? [] : [path]
	})
}

/** Failures for a page whose head carries no alternate Markdown link to its twin. */
export function checkAlternateLinks(files: readonly BuiltFile[]): readonly BuildFailure[] {
	return readerPages(files).flatMap(({ file, twin }) =>
		alternateTwinPaths(file.content).includes(twin)
			? []
			: [
					buildFailure(
						"ALTERNATE_LINK_MISSING",
						file.path,
						`the page has no alternate Markdown link to ${twin}`,
					),
				],
	)
}
