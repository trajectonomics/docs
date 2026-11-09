import { rewriteUpstreamAdrLinks } from "./adr-links"
import type { ChangelogEntry } from "./changelog"
import { parseChangelog } from "./changelog"
import { renderReleaseBlock, stripReleaseBlock, upsertReleaseBlock } from "./release-block"
import type { DocChange, PackageTarget, PortalFile, UpstreamRelease } from "./types"
import { upstreamReleaseUrl, upstreamRepository } from "./upstream-urls"

/** The page Docs Sync writes inside a package's folder. */
const PAGE_ID = "index"
const PAGE_FILE = `${PAGE_ID}.mdx`
/** The Fumadocs folder metadata, written only when the folder is new. */
const META_FILE = "meta.json"

/** Everything a proposal compares: the released package, its notes and the docs that exist. */
export interface ProposalInput {
	readonly target: PackageTarget
	readonly release: UpstreamRelease
	readonly existingDocs: readonly PortalFile[]
}

/** Turns a release into the docs edits a maintainer reviews in the draft pull request. */
export interface ProposalSynthesizer {
	synthesize(input: ProposalInput): Promise<readonly DocChange[]>
}

function normalize(text: string): string {
	return text.replace(/\s+/g, " ").trim().toLowerCase()
}

/** A page the portal does not have yet, titled for the package it documents. */
function newPage(target: PackageTarget, release: UpstreamRelease): string {
	const description = `What changed in ${target.upstreamPackage} at ${release.tag}.`
	const title = `${target.upstreamPackage} release notes`
	return `---\ntitle: ${title}\ndescription: ${description}\n---\n`
}

/** The folder metadata Fumadocs needs before a new package folder shows up in the Builder tab. */
function newMeta(target: PackageTarget): string {
	return `{\n\t"title": "${target.upstreamPackage}",\n\t"pages": ["${PAGE_ID}"]\n}\n`
}

/** The release notes as entries, with upstream ADRs linked instead of copied. */
function releaseEntries(
	target: PackageTarget,
	release: UpstreamRelease,
): readonly ChangelogEntry[] {
	const location = { repository: upstreamRepository(target.upstreamPackage), tag: release.tag }
	return parseChangelog(release.changelog).map((entry) => ({
		kind: entry.kind,
		text: rewriteUpstreamAdrLinks(entry.text, location),
	}))
}

/** The edits that put the release's notes on the package's page, and the folder around it. */
export function createProposalSynthesizer(): ProposalSynthesizer {
	return {
		async synthesize(input: ProposalInput): Promise<readonly DocChange[]> {
			const { target, release, existingDocs } = input
			const pagePath = `${target.contentDir}/${PAGE_FILE}`
			const page = existingDocs.find((file) => file.path === pagePath)
			const authored = normalize(
				existingDocs.map((file) => stripReleaseBlock(file.content)).join("\n"),
			)
			const entries = releaseEntries(target, release).filter(
				(entry) => !authored.includes(normalize(entry.text)),
			)
			const block = renderReleaseBlock({
				tag: release.tag,
				releaseUrl: upstreamReleaseUrl(target.upstreamPackage, release.tag),
				entries,
			})
			const content = upsertReleaseBlock(page?.content ?? newPage(target, release), block)
			if (content === null) {
				return []
			}
			const changes: DocChange[] = [
				{ path: pagePath, action: page === undefined ? "create" : "update", content },
			]
			const metaPath = `${target.contentDir}/${META_FILE}`
			if (page === undefined && !existingDocs.some((file) => file.path === metaPath)) {
				changes.push({ path: metaPath, action: "create", content: newMeta(target) })
			}
			return changes
		},
	}
}
