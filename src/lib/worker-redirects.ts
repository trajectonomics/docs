import { DEFAULT_TAB, DOCS_BASE_PATH, tabUrl } from "./tabs"

/**
 * Contents of the `_redirects` file for Workers Static Assets: `/docs` and `/docs/`
 * answer with a real HTTP 302 to the Operator tab.
 */
export function renderWorkerRedirects(): string {
	const target = tabUrl(DEFAULT_TAB)
	return `${DOCS_BASE_PATH} ${target} 302\n${DOCS_BASE_PATH}/ ${target} 302\n`
}
