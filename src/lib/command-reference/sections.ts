/** The command reference's folder in the content tree, where one page documents one top-level command. */
export const COMMAND_REFERENCE_ROOT = "src/content/docs/cli/commands"

/** The leaf name the global-options section of the index page is reported under. */
export const GLOBAL_LEAF = "traj"

/** The heading of the index page's section that documents the flags every command accepts. */
export const GLOBAL_OPTIONS_HEADING = "Global options"

/** One section of a page: the leaf its heading claims, and every flag its bullets name. */
export interface PageSection {
	readonly heading: string
	readonly leaf: string | undefined
	readonly flags: readonly string[]
}

/** A fenced code block's marker; every line inside the fence is an example, not a claim. */
const FENCE = /^\s*(`{3,}|~{3,})/

/** A `##` heading, which opens a new section; `###` and deeper stay inside their parent. */
const SECTION_HEADING = /^##\s+(.*)$/

/** The one heading shape that claims a leaf: a backticked `traj …` command. */
const LEAF_HEADING = /^`traj\s+([^`]+)`/

/** A backticked token, the only place a page names a flag. */
const BACKTICKED = /`([^`]+)`/g

/** A flag at the front of a token: `--dry-run`, `-h`, or the `--file` of `--file <string>`. */
const FLAG = /^(--?[a-z0-9][a-z0-9-]*)(?=[\s=]|$)/

/** The leaf a heading claims, with argument placeholders and `=value` forms stripped. */
function leafOf(heading: string): string | undefined {
	const claimed = LEAF_HEADING.exec(heading)?.[1]
	if (claimed === undefined) return undefined
	const name = claimed
		.split(/\s+/)
		.map((token) => token.split("=")[0] ?? token)
		.filter((token) => token.length > 0 && !token.startsWith("<") && !token.startsWith("["))
		.join(" ")
	return name.length === 0 ? undefined : name
}

/** Every flag a bullet line claims; a line that is not a bullet claims nothing. */
function flagsIn(line: string): readonly string[] {
	return [...line.matchAll(BACKTICKED)].flatMap((match) => {
		const token = match[1]
		const flag = token === undefined ? undefined : FLAG.exec(token)?.[1]
		return flag === undefined ? [] : [flag]
	})
}

/** The lines outside fenced code blocks: headings and bullets there are claims, not examples. */
function unfencedLines(content: string): readonly string[] {
	const lines: string[] = []
	let fence: string | undefined
	for (const line of content.split("\n")) {
		const marker = FENCE.exec(line)?.[1]
		if (marker !== undefined) {
			fence = fence === marker ? undefined : (fence ?? marker)
			continue
		}
		if (fence === undefined) lines.push(line)
	}
	return lines
}

/** Every section of a page in source order, the front matter and intro as the first one. */
export function pageSections(content: string): readonly PageSection[] {
	const sections: { heading: string; leaf: string | undefined; flags: string[] }[] = [
		{ heading: "", leaf: undefined, flags: [] },
	]
	for (const line of unfencedLines(content)) {
		const heading = SECTION_HEADING.exec(line)?.[1]
		if (heading !== undefined) {
			sections.push({ heading, leaf: leafOf(heading), flags: [] })
			continue
		}
		const current = sections[sections.length - 1]
		if (current !== undefined && line.startsWith("- ")) {
			current.flags.push(...flagsIn(line))
		}
	}
	return Object.freeze(
		sections.map((section) =>
			Object.freeze({
				heading: section.heading,
				leaf: section.leaf,
				flags: Object.freeze([...section.flags]),
			}),
		),
	)
}
