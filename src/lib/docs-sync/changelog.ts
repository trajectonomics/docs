/** What a release note entry does to the package's public behaviour. */
export type ChangelogKind = "addition" | "modification" | "deprecation" | "other"

/** One line of a release's notes, classified so the proposal can group it. */
export interface ChangelogEntry {
	readonly kind: ChangelogKind
	readonly text: string
}

/** Release note sections whose entries default to a kind, matched lowercased. */
const KIND_BY_HEADING: Readonly<Record<string, ChangelogKind>> = {
	added: "addition",
	features: "addition",
	"new features": "addition",
	changed: "modification",
	"bug fixes": "modification",
	fixed: "modification",
	performance: "modification",
	security: "modification",
	deprecated: "deprecation",
	removed: "deprecation",
	breaking: "deprecation",
	"breaking changes": "deprecation",
}

const HEADING = /^#{1,6}\s+(.+)$/
const BULLET = /^\s*[-*+]\s+(.+)$/

/** One trimmed changelog line, read as the thing it is. */
type ParsedLine =
	| { readonly type: "blank" }
	| { readonly type: "heading"; readonly kind: ChangelogKind }
	| { readonly type: "bullet"; readonly text: string }
	| { readonly type: "prose"; readonly text: string }

function parseLine(line: string): ParsedLine {
	if (line.length === 0) {
		return { type: "blank" }
	}
	const heading = HEADING.exec(line)
	if (heading !== null) {
		return { type: "heading", kind: KIND_BY_HEADING[(heading[1] ?? "").toLowerCase()] ?? "other" }
	}
	const bullet = BULLET.exec(line)?.[1]
	return bullet === undefined ? { type: "prose", text: line } : { type: "bullet", text: bullet }
}

/**
 * Read a release's changelog into classified entries. A heading changes the kind of what
 * follows, a blank line ends a prose paragraph, and a heading with no body contributes nothing.
 */
export function parseChangelog(changelog: string): readonly ChangelogEntry[] {
	const entries: ChangelogEntry[] = []
	let kind: ChangelogKind = "other"
	let prose: string[] = []
	for (const raw of changelog.split("\n")) {
		const line = parseLine(raw.trim())
		if (line.type === "prose") {
			prose.push(line.text)
			continue
		}
		if (prose.length > 0) {
			entries.push({ kind, text: prose.join(" ") })
			prose = []
		}
		if (line.type === "heading") {
			kind = line.kind
		} else if (line.type === "bullet") {
			entries.push({ kind, text: line.text })
		}
	}
	if (prose.length > 0) {
		entries.push({ kind, text: prose.join(" ") })
	}
	return Object.freeze(entries)
}
