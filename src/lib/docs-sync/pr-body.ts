import { rewriteUpstreamAdrLinks } from "./adr-links"
import type { DocChange, PackageTarget, UpstreamRelease } from "./types"
import { upstreamCompareUrl, upstreamReleaseUrl, upstreamRepository } from "./upstream-urls"

/** How much of the changelog the body carries before it defers to the release page. */
const EXCERPT_LIMIT = 2000

/** What the draft pull request says: the release it follows, what it edits and what to check. */
export interface DraftPullRequestBodyInput {
	readonly target: PackageTarget
	readonly release: UpstreamRelease
	readonly changes: readonly DocChange[]
	/** The tag the manifest recorded before this proposal, if the package was ever synced. */
	readonly previousTag: string | undefined
}

function excerptOf(target: PackageTarget, release: UpstreamRelease): string {
	const location = { repository: upstreamRepository(target.upstreamPackage), tag: release.tag }
	const rewritten = rewriteUpstreamAdrLinks(release.changelog.trim(), location)
	if (rewritten.length <= EXCERPT_LIMIT) {
		return rewritten
	}
	return `${rewritten.slice(0, EXCERPT_LIMIT).trimEnd()}\n\n_Truncated. The rest is on the [release page](${upstreamReleaseUrl(target.upstreamPackage, release.tag)})._`
}

function provenanceLines(input: DraftPullRequestBodyInput): string[] {
	const repository = upstreamRepository(input.target.upstreamPackage)
	const releaseUrl = upstreamReleaseUrl(input.target.upstreamPackage, input.release.tag)
	const comparison =
		input.previousTag === undefined
			? ["- Last synced: no earlier tag"]
			: [
					`- Comparison: [\`${input.previousTag}...${input.release.tag}\`](${upstreamCompareUrl(input.target.upstreamPackage, input.previousTag, input.release.tag)})`,
					`- Last synced: \`${input.previousTag}\``,
				]
	return [
		`- Upstream Package: [\`${repository}\`](https://github.com/${repository})`,
		`- Release: [\`${input.release.tag}\`](${releaseUrl})`,
		`- Upstream commit: \`${input.release.commitSha}\``,
		...comparison,
		`- Tab: ${input.target.audience} (\`${input.target.contentDir}\`)`,
	]
}

function upstreamDocumentationLines(input: DraftPullRequestBodyInput): string[] {
	const paths = input.release.documentationPaths
	if (paths.length === 0) {
		return []
	}
	const base = `https://github.com/${upstreamRepository(input.target.upstreamPackage)}/blob/${input.release.tag}`
	return [
		"## Upstream documentation at this tag",
		"",
		...paths.map((path) => `- [\`${path}\`](${base}/${path})`),
		"",
		"Linked, never copied: the portal is written here, for Operators and Builders.",
		"",
	]
}

function checklistLines(input: DraftPullRequestBodyInput): string[] {
	const audience = `${input.target.audience}s`
	return [
		"## Reviewer checklist",
		"",
		`- [ ] The copy is written for ${audience}, not for contributors to \`${input.target.upstreamPackage}\`.`,
		"- [ ] Only the latest release is documented; there is no version switcher.",
		"- [ ] Upstream ADRs are linked to GitHub, never copied into this repository.",
		`- [ ] \`docs-sync-manifest.json\` records \`${input.release.tag}\`; merging this pull request is what marks the release synced.`,
	]
}

/** The body of the draft pull request Docs Sync opens for one release. */
export function renderDraftPullRequestBody(input: DraftPullRequestBodyInput): string {
	const { target, release, changes } = input
	return [
		`## Docs Sync: \`${target.upstreamPackage}\` \`${release.tag}\``,
		"",
		`Docs Sync proposes these edits because the Upstream Package released \`${release.tag}\`. This pull request is a **draft**: a maintainer reviews, edits and merges it, so nothing lands on \`main\` unreviewed. Docs Sync never commits to \`main\`.`,
		"",
		...provenanceLines(input),
		"",
		"## Proposed changes",
		"",
		...changes.map((change) => `- \`${change.path}\` (${change.action})`),
		"",
		...upstreamDocumentationLines(input),
		"## Release notes",
		"",
		excerptOf(target, release),
		"",
		...checklistLines(input),
	].join("\n")
}
