import { describe, expect, test } from "bun:test"
import { subcommandsIn } from "./content-subcommands"

/** The subcommands one page shows, given the block of code it carries. */
function subcommands(block: string): ReturnType<typeof subcommandsIn> {
	return subcommandsIn(`# Page\n\n\`\`\`bash\n${block}\n\`\`\`\n`)
}

describe("the traj subcommands a page shows", () => {
	test("a two-word command line is read as a group, a leaf, its positionals and its flags", () => {
		expect(subcommands("traj account add Cash --type asset --currency THB")).toEqual([
			{
				group: "account",
				leaf: "add",
				positionals: ["Cash"],
				flags: new Map([
					["type", "asset"],
					["currency", "THB"],
				]),
			},
		])
	})

	test("a one-word command is not a subcommand, whatever follows it", () => {
		expect(subcommands("traj init\ntraj balance --as-of 2026-03-31")).toEqual([])
	})

	test("a flag that takes no value is not given the next word as its value", () => {
		expect(subcommands("traj tx import --dry-run statement.csv")[0]?.flags).toEqual(
			new Map([["dry-run", true]]),
		)
		expect(subcommands("traj tx import --dry-run statement.csv")[0]?.positionals).toEqual([
			"statement.csv",
		])
	})

	test("a quoted value is unquoted, singly or doubly", () => {
		const [command] = subcommands("traj account add 'Opening' --type \"equity\"")
		expect(command?.positionals).toEqual(["Opening"])
		expect(command?.flags).toEqual(new Map([["type", "equity"]]))
	})

	test("a trailing comment is not read as part of the command", () => {
		const [command] = subcommands("traj tx add --from Cash  # the source account")
		expect(command?.flags).toEqual(new Map([["from", "Cash"]]))
	})

	test("only fenced blocks are read, in source order", () => {
		const content =
			"Run `traj init`.\n\ntraj account add Food\n\n```bash\ntraj tx add --from Cash\n```\n\n```bash\ntraj account list\n```\n"
		expect(subcommandsIn(content).map((command) => command.leaf)).toEqual(["add", "list"])
	})

	test("a line that continues onto the next is not read", () => {
		expect(subcommands("traj tx add --from Cash \\\n  --to Food")).toEqual([])
	})
})
