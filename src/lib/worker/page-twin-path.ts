import { twinPath } from "../agent/twin-path"
import { DOCS_BASE_PATH } from "../tabs"

/** The Markdown twin a page URL negotiates, or null when the path is not a page URL. */
export function pageTwinPath(pathname: string): string | null {
	// /docs alone is the assets' redirect, and any path without a trailing slash is not a page URL.
	if (!pathname.startsWith(`${DOCS_BASE_PATH}/`) || !pathname.endsWith("/")) return null
	return twinPath(pathname)
}
