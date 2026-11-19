import { SITE_ORIGIN } from "../site"
import { DOCS_BASE_PATH, DOCS_INDEX_PATH } from "../tabs"

/** Path of the Docs index in the build output, one segment below the assets root. */
export const DOCS_INDEX_FILE = DOCS_INDEX_PATH.slice(1)

/** One bullet of the built Docs index: the title it gives a page and the twin URL it links. */
export interface DocsIndexEntry {
	readonly title: string
	readonly url: string
	readonly twin: string | undefined
}

/** One bullet: `- [Title](absolute twin URL)` with an optional description after a colon. */
const BULLET = /^- \[([^\]]+)\]\(([^)\s]+)\)(?:: [^\n]*)?$/

/** The H1 every llmstxt.org document opens with. */
const HEADING = /^# \S/

/** The twin URL path a bullet names, or `undefined` when it is not a Markdown twin on the Portal. */
function twinPathOf(url: string): string | undefined {
	let parsed: URL
	try {
		parsed = new URL(url)
	} catch {
		return undefined
	}
	if (parsed.origin !== SITE_ORIGIN) return undefined
	const path = decodeURIComponent(parsed.pathname)
	if (!path.startsWith(`${DOCS_BASE_PATH}/`) || !path.endsWith(".md")) return undefined
	return path
}

/** The entries of a built Docs index, or `undefined` when it is not a document this check can read. */
export function parseDocsIndex(content: string): readonly DocsIndexEntry[] | undefined {
	const lines = content.split("\n")
	if (!lines.some((line) => HEADING.test(line))) return undefined
	const entries = lines.flatMap((line) => {
		const match = BULLET.exec(line)
		if (match === null) return []
		const title = match[1] ?? ""
		const url = match[2] ?? ""
		return [Object.freeze({ title, url, twin: twinPathOf(url) })]
	})
	return entries.length === 0 ? undefined : Object.freeze(entries)
}
