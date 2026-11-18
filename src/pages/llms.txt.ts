import type { APIRoute } from "astro"
import {
	buildDocsIndex,
	type DocsIndexPage,
	type DocsIndexTab,
	sidebarPageUrls,
} from "../lib/agent"
import { source } from "../lib/source"
import { isTabPath, TABS } from "../lib/tabs"

export const prerender = true

/** One page the content source publishes. */
type SourcePage = ReturnType<typeof source.getPages>[number]

/** A page's index entry; a page without a frontmatter title has no faithful entry and fails the build. */
function indexPage(page: SourcePage): DocsIndexPage {
	const title = page.data.title
	if (title === undefined) {
		throw new Error(`${page.url} has no frontmatter title, so the Docs index has no entry for it`)
	}
	return { title, description: page.data.description, url: page.url }
}

/** The Docs index at `/docs/llms.txt`: every page the Tabs present, its absolute twin and its description. */
export const GET: APIRoute = () => {
	const pages = new Map(source.getPages().map((page) => [page.url, page]))
	const ordered = sidebarPageUrls(source.getPageTree()).flatMap((url) => {
		const page = pages.get(url)
		return page === undefined ? [] : [page]
	})
	const tabs: readonly DocsIndexTab[] = TABS.map((tab) => ({
		tab,
		pages: ordered.filter((page) => isTabPath(tab, page.url)).map(indexPage),
	}))
	return new Response(buildDocsIndex(tabs), {
		headers: { "content-type": "text/plain; charset=utf-8" },
	})
}
