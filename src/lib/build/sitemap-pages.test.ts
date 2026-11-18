import { describe, expect, test } from "bun:test"
import { SITE_ORIGIN } from "../site"
import { sitemapDocument, sitemapLocations } from "../sitemap"
import type { BuiltFile } from "./built-files"
import { checkSitemapPages, SITEMAP_FILE } from "./sitemap-pages"

const PAGES = ["docs/index.html", "docs/cli/index.html", "docs/cli/commands/tx/index.html"]

const URLS = [
	`${SITE_ORIGIN}/docs/`,
	`${SITE_ORIGIN}/docs/cli/`,
	`${SITE_ORIGIN}/docs/cli/commands/tx/`,
]

function page(path: string): BuiltFile {
	return { path, content: "<!doctype html><title>A page</title>" }
}

function alias(path: string, target: string): BuiltFile {
	return { path, content: `<html><meta http-equiv="refresh" content="0;url=${target}"></html>` }
}

function sitemap(locations: readonly string[]): BuiltFile {
	const urls = locations.map((location) => `<url><loc>${location}</loc></url>`).join("")
	return {
		path: SITEMAP_FILE,
		content: `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
	}
}

/** Every page a reader can open, beside the two files a Sitemap must not list. */
const PAGES_A_READER_CAN_OPEN: readonly BuiltFile[] = [
	...PAGES.map(page),
	alias("docs/operators/index.html", "/docs/cli/"),
	alias("docs/builders/index.html", "/docs/developers/"),
	page("docs/404.html"),
]

describe("the Sitemap's coverage of the pages a reader can open", () => {
	test("a Sitemap listing every page reports no failure", () => {
		const files = [...PAGES_A_READER_CAN_OPEN, sitemap(URLS)]

		expect(checkSitemapPages(files)).toEqual([])
	})

	test("a page whose slug needs percent-encoding is listed and checked once", () => {
		const files = [
			...PAGES_A_READER_CAN_OPEN,
			page("docs/cli/café/index.html"),
			sitemap([...URLS, sitemapLocations(sitemapDocument(["/docs/cli/café/"]))?.[0] ?? ""]),
		]

		expect(checkSitemapPages(files)).toEqual([])
	})

	test("a build with no Sitemap is reported as SITEMAP_MISSING", () => {
		const failures = checkSitemapPages(PAGES_A_READER_CAN_OPEN)

		expect(failures.map((failure) => failure.code)).toEqual(["SITEMAP_MISSING"])
		expect(failures[0]?.path).toBe(SITEMAP_FILE)
	})

	test("a Sitemap that is not a readable urlset is reported as SITEMAP_INVALID", () => {
		const files = [...PAGES_A_READER_CAN_OPEN, { path: SITEMAP_FILE, content: "<html></html>" }]

		expect(checkSitemapPages(files).map((failure) => failure.code)).toEqual(["SITEMAP_INVALID"])
	})

	test("a page a reader can open is reported as SITEMAP_PAGE_MISSING, naming the page", () => {
		const files = [...PAGES_A_READER_CAN_OPEN, sitemap(URLS.slice(0, 2))]

		const failures = checkSitemapPages(files)
		expect(failures.map((failure) => failure.code)).toEqual(["SITEMAP_PAGE_MISSING"])
		expect(failures[0]?.message).toContain("/docs/cli/commands/tx/")
	})

	test("a URL listed twice is reported as SITEMAP_PAGE_DUPLICATE, naming the URL", () => {
		const files = [...PAGES_A_READER_CAN_OPEN, sitemap([...URLS, URLS[0]!])]

		const failures = checkSitemapPages(files)
		expect(failures.map((failure) => failure.code)).toEqual(["SITEMAP_PAGE_DUPLICATE"])
		expect(failures[0]?.message).toContain(`${SITE_ORIGIN}/docs/`)
	})

	test("a URL that is not a page a reader can open is reported as SITEMAP_PAGE_UNEXPECTED", () => {
		const listed = [...URLS, `${SITE_ORIGIN}/docs/404.html`, `${SITE_ORIGIN}/docs/operators/`]

		const failures = checkSitemapPages([...PAGES_A_READER_CAN_OPEN, sitemap(listed)])
		expect(failures.map((failure) => failure.code)).toEqual([
			"SITEMAP_PAGE_UNEXPECTED",
			"SITEMAP_PAGE_UNEXPECTED",
		])
		expect(failures.map((failure) => failure.message).join("\n")).toContain("/docs/404.html")
		expect(failures.map((failure) => failure.message).join("\n")).toContain("/docs/operators/")
	})

	test("a URL on another origin is reported as SITEMAP_PAGE_UNEXPECTED", () => {
		const listed = [`https://example.com/docs/`, ...URLS.slice(1)]

		const failures = checkSitemapPages([...PAGES_A_READER_CAN_OPEN, sitemap(listed)])
		expect(failures.map((failure) => failure.code)).toEqual([
			"SITEMAP_PAGE_MISSING",
			"SITEMAP_PAGE_UNEXPECTED",
		])
	})

	test("a URL without its trailing slash does not match the page it names", () => {
		const listed = [`${SITE_ORIGIN}/docs/`, `${SITE_ORIGIN}/docs/cli`, URLS[2]!]

		const failures = checkSitemapPages([...PAGES_A_READER_CAN_OPEN, sitemap(listed)])
		expect(failures.map((failure) => failure.code)).toEqual([
			"SITEMAP_PAGE_MISSING",
			"SITEMAP_PAGE_UNEXPECTED",
		])
		expect(failures[0]?.message).toContain("/docs/cli/")
	})

	test("a readable urlset with no url reports every page missing, not SITEMAP_INVALID", () => {
		const failures = checkSitemapPages([...PAGES_A_READER_CAN_OPEN, sitemap([])])

		expect(failures.map((failure) => failure.code)).toEqual([
			"SITEMAP_PAGE_MISSING",
			"SITEMAP_PAGE_MISSING",
			"SITEMAP_PAGE_MISSING",
		])
	})
})
