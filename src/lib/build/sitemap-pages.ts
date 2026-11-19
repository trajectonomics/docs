import { SITE_ORIGIN } from "../site"
import { sitemapLocations } from "../sitemap"
import { SITEMAP_PATH } from "../tabs"
import type { BuiltFile } from "./built-files"
import { fileAt } from "./built-files"
import { duplicates } from "./duplicates"
import type { BuildFailure } from "./failures"
import { buildFailure } from "./failures"
import { readerPages } from "./reader-pages"

/** Path of the Sitemap in the build output, one segment below the assets root. */
export const SITEMAP_FILE = SITEMAP_PATH.slice(1)

/** One `<loc>` of the built Sitemap: the URL as written, and the page path it names when on the origin. */
interface ListedUrl {
	readonly location: string
	readonly path: string | undefined
}

/** The URL paths of the pages a reader can open, sorted. */
function readerPagePaths(files: readonly BuiltFile[]): readonly string[] {
	return readerPages(files)
		.map((page) => page.url)
		.sort()
}

/**
 * The page path a `<loc>` names, or `undefined` when it is not a URL on the Portal's origin. A URL
 * carries its path percent-encoded, so it is decoded to the slug the build knows.
 */
function parseLocation(location: string): ListedUrl {
	try {
		const url = new URL(location)
		const path = url.origin === SITE_ORIGIN ? decodeURIComponent(url.pathname) : undefined
		return { location, path }
	} catch {
		return { location, path: undefined }
	}
}

/** The `<loc>` values that name no page a reader can open, in the order the document lists them. */
function unexpectedLocations(
	listed: readonly ListedUrl[],
	expectedPages: ReadonlySet<string>,
): readonly string[] {
	const unexpected = new Set<string>()
	for (const { location, path } of listed) {
		if (path === undefined || !expectedPages.has(path)) unexpected.add(location)
	}
	return [...unexpected]
}

/** Failures for a Sitemap the build did not produce, cannot be read, or no longer matches the pages. */
export function checkSitemapPages(files: readonly BuiltFile[]): readonly BuildFailure[] {
	const file = fileAt(files, SITEMAP_FILE)
	if (file === undefined) {
		return [buildFailure("SITEMAP_MISSING", SITEMAP_FILE, "the build did not produce the Sitemap")]
	}
	const locations = sitemapLocations(file.content)
	if (locations === undefined) {
		return [
			buildFailure(
				"SITEMAP_INVALID",
				SITEMAP_FILE,
				"the Sitemap is not a urlset document this check can read",
			),
		]
	}
	const expectedPages = readerPagePaths(files)
	const listed = locations.map(parseLocation)
	const listedPaths = new Set(listed.map((url) => url.path))
	return [
		...expectedPages
			.filter((page) => !listedPaths.has(page))
			.map((page) =>
				buildFailure("SITEMAP_PAGE_MISSING", SITEMAP_FILE, `the Sitemap does not list ${page}`),
			),
		...duplicates(locations).map((location) =>
			buildFailure(
				"SITEMAP_PAGE_DUPLICATE",
				SITEMAP_FILE,
				`the Sitemap lists ${location} more than once`,
			),
		),
		...unexpectedLocations(listed, new Set(expectedPages)).map((location) =>
			buildFailure(
				"SITEMAP_PAGE_UNEXPECTED",
				SITEMAP_FILE,
				`the Sitemap lists ${location}, which is not a page a reader can open`,
			),
		),
	]
}
