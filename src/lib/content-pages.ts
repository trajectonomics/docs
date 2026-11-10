/** One file of the Docs Portal content tree: its path under `src/content/docs/` and its text. */
export interface ContentFile {
	readonly path: string
	readonly content: string
}

/** The content directory, relative to the repository root. */
export const CONTENT_ROOT = "src/content/docs"

/** Extensions Fumadocs reads as a page. */
const PAGE_EXTENSIONS = [".mdx", ".md"] as const

/** Whether `path`, without an extension, names a page file. */
export function hasPage(files: readonly ContentFile[], path: string): boolean {
	return PAGE_EXTENSIONS.some((extension) =>
		files.some((file) => file.path === `${path}${extension}`),
	)
}

/** Whether `folder` has the landing page Fumadocs takes as the folder's own page. */
export function hasLandingPage(files: readonly ContentFile[], folder: string): boolean {
	return hasPage(files, `${folder}/index`)
}

/**
 * The page entries of a folder's `meta.json`: separators, exclusions, links and the `...`
 * placeholders are not pages, so they are left out.
 */
export function navigationEntries(
	files: readonly ContentFile[],
	folder: string,
): readonly string[] {
	const path = folder === "" ? "meta.json" : `${folder}/meta.json`
	const meta = files.find((file) => file.path === path)
	if (meta === undefined) {
		return []
	}
	const parsed: unknown = JSON.parse(meta.content)
	const pages =
		typeof parsed === "object" && parsed !== null
			? (parsed as Record<string, unknown>)["pages"]
			: undefined
	if (!Array.isArray(pages)) {
		return []
	}
	return pages.filter(
		(entry): entry is string =>
			typeof entry === "string" &&
			!entry.startsWith("!") &&
			!entry.startsWith("[") &&
			!entry.startsWith("---") &&
			entry !== "..." &&
			entry !== "z...a",
	)
}

/** Whether a `meta.json` page entry names a page or a folder that has one. */
export function resolvesNavigationEntry(
	files: readonly ContentFile[],
	folder: string,
	entry: string,
): boolean {
	const target = folder === "" ? entry : `${folder}/${entry}`
	return hasPage(files, target) || hasLandingPage(files, target)
}

/** A markdown link to a site path under the Docs Portal base; `!` makes it an image. */
const INTERNAL_LINK = /(!?)\]\((\/docs(?:\/[^)\s]*)?)\)/g

/** Every site-absolute link under `/docs` in `content`, in source order. */
export function internalLinks(content: string): readonly string[] {
	const links: string[] = []
	for (const match of content.matchAll(INTERNAL_LINK)) {
		const [, image, link] = match
		if (image !== "!" && link !== undefined) {
			links.push(link)
		}
	}
	return links
}

/** The content path a `/docs` URL names, with the base, trailing slashes, fragment and query gone. */
export function contentPathOf(url: string): string {
	const path = url.split(/[?#]/)[0] ?? ""
	return path.replace(/^\/docs\/?/, "").replace(/\/+$/, "")
}
