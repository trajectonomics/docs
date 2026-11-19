import { twinPath } from "../agent/twin-path"
import { DOCS_BASE_PATH } from "../tabs"

/**
 * The Markdown twin a request path negotiates, or null when the path is not a page URL. A page URL
 * is `/docs/` or a path under it with a trailing slash; `/docs` alone is the assets' redirect and
 * every other path is a twin, an index file or an asset, served as it is.
 */
export function pageTwinPath(pathname: string): string | null {
	if (!pathname.startsWith(`${DOCS_BASE_PATH}/`) || !pathname.endsWith("/")) return null
	return twinPath(pathname)
}
