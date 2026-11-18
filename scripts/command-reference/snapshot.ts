import type { ReleaseLeaf } from "../../src/lib/command-reference"
import { CheckError } from "./errors"

/** A JSON object as a record, for the shape checks every CLI output needs. */
function asRecord(value: unknown): Record<string, unknown> | undefined {
	return typeof value === "object" && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined
}

/** The leaf names a `schema --json` listing carries; a listing of another shape is refused. */
export function leafNamesOf(listed: unknown): readonly string[] {
	const commands = asRecord(listed)?.["commands"]
	if (!Array.isArray(commands)) {
		throw new CheckError("COMMANDS_NOT_LISTED", "`schema --json` did not list the commands")
	}
	const names: string[] = []
	for (const command of commands) {
		const name = asRecord(command)?.["name"]
		if (typeof name !== "string") {
			throw new CheckError("LEAF_UNNAMED", "`schema --json` listed a command without a name")
		}
		names.push(name)
	}
	return names
}

/** The flag a schema property names: `dryRun` is `--dry-run`, `carryIn` is `--carry-in`. */
function flagOf(property: string): string {
	return `--${property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
}

/** One released leaf, from the schema its own name prints. */
export function leafFromSchema(schema: unknown, name: string): ReleaseLeaf {
	const record = asRecord(schema)
	const positionals = record?.["positionals"]
	if (
		!Array.isArray(positionals) ||
		positionals.some((positional) => typeof positional !== "string")
	) {
		throw new CheckError(
			"POSITIONALS_UNDESCRIBED",
			`\`schema ${name} --json\` did not describe the leaf's positionals`,
		)
	}
	const properties = asRecord(record?.["input"])?.["properties"]
	const described = asRecord(properties)
	if (described === undefined) {
		throw new CheckError(
			"INPUT_UNDESCRIBED",
			`\`schema ${name} --json\` did not describe the leaf's input as a schema`,
		)
	}
	const positional = new Set(positionals as readonly string[])
	const flags = Object.keys(described)
		.filter((property) => !positional.has(property))
		.map(flagOf)
	return Object.freeze({ name, flags: Object.freeze(flags) })
}

/** The flags one line of a `Global options:` block names, or a refusal when it names none. */
function flagsOnLine(line: string): readonly string[] {
	const leading = line.trim().split(/\s{2,}/)[0] ?? ""
	const names = [...leading.matchAll(/-{1,2}[a-z][a-z0-9-]*/g)].map((match) => match[0])
	if (names.length === 0) {
		throw new CheckError(
			"GLOBAL_OPTIONS_UNREADABLE",
			`the \`Global options:\` block is not readable: ${line.trim()}`,
		)
	}
	return names
}

/** The global flags a `help` call prints, from its `Global options:` block. */
export function globalFlagsOf(help: string): readonly string[] {
	const block = help.split("Global options:")[1]?.split(/\n\s*\n/)[0]
	if (block === undefined) {
		throw new CheckError("GLOBAL_OPTIONS_MISSING", "`help` printed no `Global options:` block")
	}
	const flags = block
		.split("\n")
		.filter((line) => line.trim().length > 0)
		.flatMap(flagsOnLine)
	if (flags.length === 0) {
		throw new CheckError("GLOBAL_OPTIONS_EMPTY", "`help` printed an empty `Global options:` block")
	}
	return flags
}
