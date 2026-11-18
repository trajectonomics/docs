import type { APIRoute } from "astro"
import { sitemapDocument } from "../lib/sitemap"
import { source } from "../lib/source"
import { DOCS_BASE_PATH } from "../lib/tabs"

export const prerender = true

/** The Sitemap of every page the Docs Portal serves, written at build time like the search index. */
export const GET: APIRoute = () => {
	const paths = [
		`${DOCS_BASE_PATH}/`,
		...source.getPages().map((page) => `${DOCS_BASE_PATH}/${page.slugs.join("/")}`),
	]
	return new Response(sitemapDocument(paths), {
		headers: { "content-type": "application/xml" },
	})
}
