import type { ChangelogEntry, ChangelogKind } from "./changelog"

/** The comment markers that delimit the block Docs Sync owns inside a portal page. */
export const RELEASE_BLOCK_START = "<!-- docs-sync:release-notes:start -->"
export const RELEASE_BLOCK_END = "<!-- docs-sync:release-notes:end -->"

/** The groups of a release block, in the order a reader should meet them. */
const GROUPS: readonly (readonly [ChangelogKind, string])[] = [
	["addition", "Added"],
	["modification", "Changed"],
	["deprecation", "Deprecated"],
	["other", "Also in this release"],
]

/** What a release block states: the tag, where it came from, and what is new to the portal. */
export interface ReleaseBlockInput {
	readonly tag: string
	readonly releaseUrl: string
	readonly entries: readonly ChangelogEntry[]
}

function groupLines(
	kind: ChangelogKind,
	tag: string,
	entries: readonly ChangelogEntry[],
): string[] {
	const group = entries.filter((entry) => entry.kind === kind)
	if (group.length === 0) {
		return []
	}
	const title = GROUPS.find(([groupKind]) => groupKind === kind)?.[1] ?? kind
	const prefix = kind === "deprecation" ? "> - " : "- "
	const callout =
		kind === "deprecation"
			? [`> These parts are deprecated or removed in ${tag}; check them before you upgrade.`, ">"]
			: []
	return [`### ${title}`, "", ...callout, ...group.map((entry) => `${prefix}${entry.text}`), ""]
}

/** The markdown block Docs Sync owns: the latest release only, grouped by what it does. */
export function renderReleaseBlock(input: ReleaseBlockInput): string {
	const intro = `Synced from [the ${input.tag} release](${input.releaseUrl}). Only the latest release of each Upstream Package is documented here.`
	const groups = GROUPS.flatMap(([kind]) => groupLines(kind, input.tag, input.entries))
	return [
		RELEASE_BLOCK_START,
		`## Latest release: ${input.tag}`,
		"",
		intro,
		"",
		...groups,
		RELEASE_BLOCK_END,
	].join("\n")
}

function blockRange(content: string): { readonly start: number; readonly end: number } | null {
	const start = content.indexOf(RELEASE_BLOCK_START)
	const end = content.indexOf(RELEASE_BLOCK_END)
	return start === -1 || end < start ? null : { start, end: end + RELEASE_BLOCK_END.length }
}

/**
 * `content` with `block` in place of the block it already carries, appended when it carries
 * none. Returns `null` when the resulting page would be identical, so nothing is proposed.
 */
export function upsertReleaseBlock(content: string, block: string): string | null {
	const range = blockRange(content)
	const updated =
		range === null
			? `${content.trimEnd()}\n\n${block}\n`
			: `${content.slice(0, range.start)}${block}${content.slice(range.end)}`
	return updated === content ? null : updated
}

/** `content` without the block, so authored copy can be compared against a release. */
export function stripReleaseBlock(content: string): string {
	const range = blockRange(content)
	return range === null ? content : `${content.slice(0, range.start)}${content.slice(range.end)}`
}
