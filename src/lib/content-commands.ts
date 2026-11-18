/** One `traj` command line a page shows: its group and leaf, its positionals and its flags. */
export interface ContentCommand {
	readonly group: string
	readonly leaf: string
	readonly positionals: readonly string[]
	readonly flags: ReadonlyMap<string, string | true>
}

/** Flags that take no value, so the token after one is the next flag or positional. */
const BOOLEAN_FLAGS = new Set(["opening", "dry-run", "json", "help", "version"])

/** The words of one command line, quoted values unquoted and a trailing `#` comment dropped. */
function words(line: string): readonly string[] {
	const [body = ""] = line.split(/\s#/)
	return [...body.matchAll(/"[^"]*"|'[^']*'|\S+/g)].map((match) =>
		match[0].replace(/^["']|["']$/g, ""),
	)
}

/** The positionals and the flags of the words after a `traj` group and leaf. */
function argumentsOf(words: readonly string[]): {
	readonly positionals: readonly string[]
	readonly flags: ReadonlyMap<string, string | true>
} {
	const positionals: string[] = []
	const flags = new Map<string, string | true>()
	let index = 0
	while (index < words.length) {
		const token = words[index] ?? ""
		const value = words[index + 1]
		if (!token.startsWith("--")) {
			positionals.push(token)
			index += 1
			continue
		}
		const flag = token.slice(2)
		const takesValue = value !== undefined && !value.startsWith("--") && !BOOLEAN_FLAGS.has(flag)
		flags.set(flag, takesValue ? value : true)
		index += takesValue ? 2 : 1
	}
	return { positionals, flags }
}

/** The `traj` command a line states, or `undefined` when the line is not one the rule can read. */
function parse(line: string): ContentCommand | undefined {
	if (line.trimEnd().endsWith("\\")) return undefined
	const [program, group, leaf, ...rest] = words(line)
	if (program !== "traj" || group === undefined || leaf === undefined) return undefined
	return { group, leaf, ...argumentsOf(rest) }
}

/** The lines inside the page's fenced code blocks, in source order. */
function fencedLines(content: string): readonly string[] {
	const lines: string[] = []
	let inside = false
	for (const line of content.split("\n")) {
		if (line.trimStart().startsWith("```")) inside = !inside
		else if (inside) lines.push(line)
	}
	return lines
}

/** Every `traj` command line in the page's fenced code blocks, in source order. */
export function commandsIn(content: string): readonly ContentCommand[] {
	const commands: ContentCommand[] = []
	for (const line of fencedLines(content)) {
		const command = parse(line)
		if (command !== undefined) commands.push(command)
	}
	return commands
}
