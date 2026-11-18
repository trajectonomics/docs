import type { ReleaseLeaf } from "../../src/lib/command-reference"
import { UnreadableError } from "./deps"

/** A JSON object as a record, for the shape checks every CLI output needs. */
function asRecord(value: unknown): Record<string, unknown> | undefined {
	return typeof value === "object" && value !== null && !Array.isArray(value)
		? (value as Record<string, unknown>)
		: undefined
}

/** The leaf names a `schema --json` listing carries; a listing of another shape is unreadable. */
export function leafNamesOf(listed: unknown): readonly string[] {
	const commands = asRecord(listed)?.["commands"]
	if (!Array.isArray(commands)) {
		throw new UnreadableError("`schema --json` did not list the commands")
	}
	const names: string[] = []
	for (const command of commands) {
		const name = asRecord(command)?.["name"]
		if (typeof name !== "string") {
			throw new UnreadableError("`schema --json` listed a command without a name")
		}
		names.push(name)
	}
	return names
}

/** The flag a schema property names: `dryRun` is `--dry-run`, `carryIn` is `--carry-in`. */
function flagOf(property: string): string {
	return `--${property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
}

/** One leaf's flags: its input schema's properties minus its positionals, kebab-cased. */
export function leafOf(schema: unknown, name: string): ReleaseLeaf {
	const record = asRecord(schema)
	const positionals = record?.["positionals"]
	const input = asRecord(record?.["input"])
	if (
		!Array.isArray(positionals) ||
		positionals.some((positional) => typeof positional !== "string")
	) {
		throw new UnreadableError(`\`schema ${name} --json\` did not describe the leaf's positionals`)
	}
	if (input === undefined) {
		throw new UnreadableError(`\`schema ${name} --json\` did not describe the leaf's input`)
	}
	const properties = input["properties"]
	const described = asRecord(properties)
	if (properties !== undefined && described === undefined) {
		throw new UnreadableError(`\`schema ${name} --json\` did not describe the leaf's input`)
	}
	const positional = new Set(positionals as readonly string[])
	const flags = Object.keys(described ?? {})
		.filter((property) => !positional.has(property))
		.map(flagOf)
	return Object.freeze({ name, flags: Object.freeze(flags) })
}

/** The global flags a `help` call prints, from its `Global options:` block. */
export function globalFlagsOf(help: string): readonly string[] {
	const block = help.split("Global options:")[1]?.split(/\n\s*\n/)[0]
	if (block === undefined) {
		throw new UnreadableError("`help` printed no `Global options:` block")
	}
	const flags: string[] = []
	for (const line of block.split("\n")) {
		if (line.trim().length === 0) continue
		const leading = line.trim().split(/\s{2,}/)[0] ?? ""
		const names = [...leading.matchAll(/-{1,2}[a-z][a-z0-9-]*/g)].map((match) => match[0])
		if (names.length === 0) {
			throw new UnreadableError(`the \`Global options:\` block is not readable: ${line.trim()}`)
		}
		flags.push(...names)
	}
	if (flags.length === 0) {
		throw new UnreadableError("`help` printed an empty `Global options:` block")
	}
	return flags
}
