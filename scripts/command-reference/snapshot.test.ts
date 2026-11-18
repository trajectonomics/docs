import { describe, expect, test } from "bun:test"
import { globalFlagsOf, leafFromSchema, leafNamesOf } from "./snapshot"

/** The code a refusal carries, so a test names the rule rather than its wording. */
function codeOf(run: () => unknown): string | undefined {
	try {
		run()
		return undefined
	} catch (error) {
		return error instanceof Error && "code" in error ? String(error.code) : "NO_CODE"
	}
}

describe("the leaf names of a schema listing", () => {
	test("are refused as COMMANDS_NOT_LISTED when the listing carries no commands", () => {
		expect(codeOf(() => leafNamesOf({ error: "nothing" }))).toBe("COMMANDS_NOT_LISTED")
	})

	test("are refused as COMMANDS_NOT_LISTED when the listing is not an object", () => {
		expect(codeOf(() => leafNamesOf("traj"))).toBe("COMMANDS_NOT_LISTED")
	})

	test("are refused as LEAF_UNNAMED when a command has no name", () => {
		expect(codeOf(() => leafNamesOf({ commands: [{ summary: "no name" }] }))).toBe("LEAF_UNNAMED")
	})

	test("are the names the listing carries, in order", () => {
		expect(leafNamesOf({ commands: [{ name: "tx add" }, { name: "fi" }] })).toEqual([
			"tx add",
			"fi",
		])
	})
})

describe("a leaf's flags", () => {
	test("are its input properties minus its positionals, kebab-cased", () => {
		const leaf = leafFromSchema(
			{ positionals: ["name"], input: { properties: { name: {}, dryRun: {}, carryIn: {} } } },
			"scenario apply",
		)
		expect(leaf).toEqual({ name: "scenario apply", flags: ["--dry-run", "--carry-in"] })
	})

	test("are refused as POSITIONALS_UNDESCRIBED when the positionals are not a list of names", () => {
		expect(
			codeOf(() => leafFromSchema({ positionals: [1], input: { properties: {} } }, "fi")),
		).toBe("POSITIONALS_UNDESCRIBED")
	})

	test("are refused as POSITIONALS_UNDESCRIBED when the schema has no positionals", () => {
		expect(codeOf(() => leafFromSchema({ input: { properties: {} } }, "fi"))).toBe(
			"POSITIONALS_UNDESCRIBED",
		)
	})

	test("are refused as INPUT_UNDESCRIBED when the input schema is missing", () => {
		expect(codeOf(() => leafFromSchema({ positionals: [] }, "fi"))).toBe("INPUT_UNDESCRIBED")
	})

	test("are refused as INPUT_UNDESCRIBED when the input carries no properties object", () => {
		expect(
			codeOf(() => leafFromSchema({ positionals: [], input: { properties: "none" } }, "fi")),
		).toBe("INPUT_UNDESCRIBED")
	})
})

describe("the global flags", () => {
	const HELP = [
		"Usage: traj fi [options]",
		"",
		"Global options:",
		"  --json         Print JSON",
		"  -h, --help     Show usage",
		"  -v, --version  Print the version",
		"",
		"Examples:",
	].join("\n")

	test("are the flags of the `Global options:` block", () => {
		expect(globalFlagsOf(HELP)).toEqual(["--json", "-h", "--help", "-v", "--version"])
	})

	test("are refused as GLOBAL_OPTIONS_MISSING when the help output has no block", () => {
		expect(codeOf(() => globalFlagsOf("Usage: traj fi [options]\n"))).toBe("GLOBAL_OPTIONS_MISSING")
	})

	test("are refused as GLOBAL_OPTIONS_UNREADABLE when a line of the block names no flag", () => {
		const help = "Global options:\n  no flag here\n"
		expect(codeOf(() => globalFlagsOf(help))).toBe("GLOBAL_OPTIONS_UNREADABLE")
	})

	test("are refused as GLOBAL_OPTIONS_EMPTY when the block has no lines", () => {
		expect(codeOf(() => globalFlagsOf("Global options:\n\nExamples:\n"))).toBe(
			"GLOBAL_OPTIONS_EMPTY",
		)
	})
})
