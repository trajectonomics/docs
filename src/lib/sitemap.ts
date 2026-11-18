/**
 * The Sitemap: the machine-readable list of the Docs Portal's pages (GLOSSARY.md). The document is
 * built and read here by pure functions; `pages/sitemap.xml.ts` is the adapter that serves it.
 */

import { SITE_ORIGIN } from "./site"

/** The sitemap protocol's namespace, which every `<urlset>` states. */
const SITEMAP_NAMESPACE = "http://www.sitemaps.org/schemas/sitemap/0.9"

/** The five predefined XML entities a document's text carries, as their characters. */
const XML_ENTITIES: Readonly<Record<string, string>> = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	apos: "'",
}

/** The absolute URL of a page path, with exactly one trailing slash and no date. */
function pageUrl(path: string): string {
	const slug = path.replace(/^\/+|\/+$/g, "")
	return slug.length === 0 ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}/${slug}/`
}

/** `value` with the XML characters escaped, so a page path cannot break the document. */
function escapeXml(value: string): string {
	return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/** An escaped XML value with the five predefined entities decoded back to their characters. */
function decodeXml(value: string): string {
	return value.replace(
		/&(amp|lt|gt|quot|apos);/g,
		(_entity, name: string) => XML_ENTITIES[name] ?? `&${name};`,
	)
}

/** The XML Sitemap document listing `paths` as absolute URLs, sorted, each once. */
export function sitemapDocument(paths: readonly string[]): string {
	const locations = [...new Set(paths.map(pageUrl))].sort()
	return [
		'<?xml version="1.0" encoding="UTF-8"?>',
		`<urlset xmlns="${SITEMAP_NAMESPACE}">`,
		...locations.map((location) => `  <url><loc>${escapeXml(location)}</loc></url>`),
		"</urlset>",
	].join("\n")
}

/** The `<loc>` values of a Sitemap document, or `undefined` when it is not a readable `<urlset>`. */
export function sitemapLocations(xml: string): readonly string[] | undefined {
	const body = /<urlset\b[^>]*>([\s\S]*)<\/urlset>/i.exec(xml)?.[1]
	if (body === undefined) return undefined
	const urls = [...body.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((match) => match[1] ?? "")
	if (/<\/?url\b/.test(body.replace(/<url>[\s\S]*?<\/url>/g, ""))) return undefined
	const locations: string[] = []
	for (const url of urls) {
		const text = /<loc>([\s\S]*?)<\/loc>/.exec(url)?.[1]?.trim()
		if (text === undefined || text.length === 0) return undefined
		locations.push(decodeXml(text))
	}
	return locations
}
