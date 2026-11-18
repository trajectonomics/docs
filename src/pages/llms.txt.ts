import type { APIRoute } from "astro"
import {
	buildDocsIndex,
	buildStep,
	type DocsIndexTab,
	pageWords,
	sidebarPageUrls,
} from "../lib/agent"
import { source } from "../lib/source"
import { isTabPath, TABS } from "../lib/tabs"

export const prerender = true

/** The Docs index at `/docs/llms.txt`: every page the Tabs present, its absolute twin and its description. */
export const GET: APIRoute = () =>
	buildStep(() => {
		const pages = new Map(source.getPages().map((page) => [page.url, page]))
		const ordered = sidebarPageUrls(source.getPageTree()).flatMap((url) => {
			const page = pages.get(url)
			return page === undefined ? [] : [page]
		})
		const tabs: readonly DocsIndexTab[] = TABS.map((tab) => ({
			tab,
			pages: ordered.filter((page) => isTabPath(tab, page.url)).map(pageWords),
		}))
		return new Response(buildDocsIndex(tabs), {
			headers: { "content-type": "text/plain; charset=utf-8" },
		})
	})
