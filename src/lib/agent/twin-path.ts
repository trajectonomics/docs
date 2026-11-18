import { DOCS_BASE_PATH } from "../tabs"

/** The URL path of a page's Markdown twin: the page's path with `.md` in place of its trailing slash. */
export function twinPath(pageUrl: string): string {
	const path = pageUrl.replace(/\/+$/, "")
	return path === DOCS_BASE_PATH ? `${DOCS_BASE_PATH}/index.md` : `${path}.md`
}
