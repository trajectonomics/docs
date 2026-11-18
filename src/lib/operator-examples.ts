import type { ContentFile } from "./content-pages"
import { OPERATOR_TAB_CONTENT } from "./release-truth"

/** One rule of the operator-examples check; one value per way an Operator page can break it. */
export type OperatorExampleRule = "opening-account"

/** An `--opening` example whose page never creates the equity account it posts against. */
export interface OperatorExampleProblem {
	readonly rule: OperatorExampleRule
	readonly file: string
	readonly detail: string
}

/** One line of a page's code blocks: the `traj` group and leaf, its positionals and its flags. */
interface Command {
	readonly group: string
	readonly leaf: string
	readonly positionals: readonly string[]
	readonly flags: ReadonlyMap<string, string | true>
}

/** Flags that take no value, so the token after one is the next flag or positional. */
const BOOLEAN_FLAGS = new Set([
	"opening",
	"dry-run",
	"json",
	"help",
	"version",
	"monthly",
	"template",
	"trial-balance",
])

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
function parse(line: string): Command | undefined {
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

/** The equity account a line creates, when the line is `traj account add <name> --type equity`. */
function createdEquityAccount(command: Command): string | undefined {
	if (command.group !== "account" || command.leaf !== "add") return undefined
	const name = command.positionals[0]
	return command.flags.get("type") === "equity" ? name : undefined
}

/** The account an `--opening` example posts against, when the line is an opening balance. */
function openingAccount(command: Command): string | undefined {
	if (command.group !== "tx" || (command.leaf !== "add" && command.leaf !== "amend"))
		return undefined
	if (command.flags.get("opening") !== true) return undefined
	const from = command.flags.get("from")
	return typeof from === "string" ? from : undefined
}

function pageProblems(file: ContentFile): readonly OperatorExampleProblem[] {
	if (!file.path.startsWith(`${OPERATOR_TAB_CONTENT}/`)) return []
	const problems: OperatorExampleProblem[] = []
	const equity = new Set<string>()
	for (const line of fencedLines(file.content)) {
		const command = parse(line)
		if (command === undefined) continue
		const created = createdEquityAccount(command)
		if (created !== undefined) equity.add(created)
		const account = openingAccount(command)
		if (account === undefined || equity.has(account)) continue
		const detail = `an --opening example posts against ${account}, which the page does not create as an equity account`
		problems.push({ rule: "opening-account", file: file.path, detail })
	}
	return problems
}

/** Every `--opening` example whose Operator page never creates the equity account it posts against. */
export function checkOperatorExamples(
	files: readonly ContentFile[],
): readonly OperatorExampleProblem[] {
	return files.flatMap(pageProblems)
}
