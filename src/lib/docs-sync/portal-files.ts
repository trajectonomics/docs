import type { DocChange, PackageTarget, PortalFile } from "./types"

/** The page id and folder metadata a package folder needs before Fumadocs lists it. */
const PAGE_ID = "index"

/** The folder a repository-relative path lives in. */
export function parentOf(path: string): string {
	const cut = path.lastIndexOf("/")
	return cut === -1 ? "" : path.slice(0, cut)
}

/** The last segment of a repository-relative path, which is the folder a Tab lists. */
export function lastSegmentOf(path: string): string {
	return path.slice(path.lastIndexOf("/") + 1)
}

/** A page the portal does not have yet, titled for the package it documents. */
export function newPage(target: PackageTarget, release: { readonly tag: string }): string {
	const description = `What changed in ${target.upstreamPackage} at ${release.tag}.`
	return `---\ntitle: ${target.upstreamPackage} release notes\ndescription: ${description}\n---\n`
}

/** The folder metadata a new package folder needs before Fumadocs shows the page. */
export function newMeta(target: PackageTarget): string {
	return `{\n\t"title": "${target.upstreamPackage}",\n\t"pages": ["${PAGE_ID}"]\n}\n`
}

/**
 * `content` with `folder` added to its `pages` list, as text, so the rest of the file keeps the
 * formatting it already had. Returns `null` when the list already names the folder or has none.
 */
export function withPageListed(content: string, folder: string): string | null {
	const pages = /"pages":\s*\[([^\]]*)\]/.exec(content)
	const items = pages?.[1]
	if (pages === null || items === undefined || items.includes(`"${folder}"`)) {
		return null
	}
	const separator = items.trim().length === 0 ? "" : ", "
	const listed = `"pages": [${items}${separator}"${folder}"]`
	return `${content.slice(0, pages.index)}${listed}${content.slice(pages.index + pages[0].length)}`
}

/**
 * The Tab's own metadata with the new package folder added, so a first release does not stage a
 * page nobody can navigate to. `null` when the Tab metadata is absent or already lists it.
 */
export function parentMetaChange(
	target: PackageTarget,
	existingDocs: readonly PortalFile[],
): DocChange | null {
	const parentPath = `${parentOf(target.contentDir)}/meta.json`
	const parent = existingDocs.find((file) => file.path === parentPath)
	const listed =
		parent === undefined ? null : withPageListed(parent.content, lastSegmentOf(target.contentDir))
	return listed === null ? null : { path: parentPath, action: "update", content: listed }
}
