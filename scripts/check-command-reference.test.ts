import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { COMMAND_REFERENCE_ROOT, type ContentFile } from "../src/lib/command-reference"
import { INDEX, page } from "../src/lib/command-reference/fixtures"
import { main } from "./check-command-reference"
import { parseArguments } from "./command-reference/arguments"
import type { CommandReferenceDeps } from "./command-reference/deps"

const TX = page(
	"tx.mdx",
	"## `traj tx add <id>`\n\n- `--from <string>` — source.\n- `--dry-run` — roll back.\n",
)

const FI = page("fi.mdx", "- `--scenario <string>` — the Scenario.\n")

/** The schemas a fake `bunx` answers with, keyed by the leaf path the call names. */
const SCHEMAS: Readonly<Record<string, unknown>> = {
	"tx add": {
		name: "tx add",
		positionals: ["id"],
		input: { properties: { id: {}, dryRun: {}, from: {} } },
	},
	fi: { name: "fi", positionals: [], input: { properties: { scenario: {} } } },
}

const HELP = [
	"Usage: traj tx add [options] <id>",
	"",
	"Global options:",
	"  --json         Print JSON",
	"  -h, --help     Show usage",
	"  -v, --version  Print the version",
	"",
	"Examples:",
].join("\n")

interface FakeOptions {
	readonly listed?: unknown
	readonly latest?: string | undefined
	readonly pages?: readonly ContentFile[] | undefined
	readonly baselinePages?: readonly ContentFile[] | undefined
}

interface Fake {
	readonly deps: CommandReferenceDeps
	readonly lines: string[]
	readonly sleeps: number[]
}

/** The check over a fake registry, a fake `bunx` and in-memory pages. */
function fakeDeps(options: FakeOptions = {}): Fake {
	const lines: string[] = []
	const sleeps: number[] = []
	const deps: CommandReferenceDeps = {
		now: () => sleeps.reduce((total, ms) => total + ms, 0),
		sleep: async (ms: number) => {
			sleeps.push(ms)
		},
		print: (line: string) => {
			lines.push(line)
		},
		latestVersion: async () => ("latest" in options ? options.latest : "0.2.0"),
		cliJson: async (_version: string, args: readonly string[]) => {
			if (args[0] !== "schema") return undefined
			const path = args.slice(1, -1).join(" ")
			if (path === "") return options.listed ?? { commands: [{ name: "tx add" }, { name: "fi" }] }
			return SCHEMAS[path]
		},
		cliText: async () => HELP,
		pages: async () => ("pages" in options ? options.pages : [INDEX, TX, FI]),
		pagesAt: async () => options.baselinePages,
	}
	return { deps, lines, sleeps }
}

describe("a command reference that agrees with the published CLI", () => {
	test("exits 0 and names the release it compared against", async () => {
		const fake = fakeDeps()
		expect(await main([], fake.deps)).toBe(0)
		expect(fake.lines.join("\n")).toContain("no problems")
		expect(fake.lines.join("\n")).toContain("0.2.0")
	})
})

describe("a page that drifts from the published CLI", () => {
	test("exits 1 and names the page, the leaf and the flag", async () => {
		const fake = fakeDeps({ pages: [INDEX, TX, page("fi.mdx", "")] })
		expect(await main([], fake.deps)).toBe(1)
		expect(fake.lines.join("\n")).toContain(`${COMMAND_REFERENCE_ROOT}/fi.mdx`)
		expect(fake.lines.join("\n")).toContain("fi is missing --scenario")
	})
})

describe("a release that cannot be read", () => {
	test("exits 2 with RELEASE_UNREADABLE after the bounded wait", async () => {
		const fake = fakeDeps({ latest: undefined })
		expect(await main([], fake.deps)).toBe(2)
		expect(fake.lines.join("\n")).toContain("RELEASE_UNREADABLE")
		expect(fake.sleeps.length).toBeGreaterThan(0)
	})

	test("exits 2 with NO_LEAVES_LISTED when the listing names no leaf", async () => {
		const fake = fakeDeps({ listed: { commands: [] } })
		expect(await main([], fake.deps)).toBe(2)
		expect(fake.lines.join("\n")).toContain("NO_LEAVES_LISTED")
	})
})

describe("pages that cannot be read", () => {
	test("exits 2 with PAGES_UNREADABLE rather than passing", async () => {
		const fake = fakeDeps({ pages: undefined })
		expect(await main([], fake.deps)).toBe(2)
		expect(fake.lines.join("\n")).toContain("PAGES_UNREADABLE")
	})

	test("exits 2 with BASELINE_UNREADABLE when the baseline ref cannot be read", async () => {
		const fake = fakeDeps({ baselinePages: undefined })
		expect(await main(["--baseline", "origin/main"], fake.deps)).toBe(2)
		expect(fake.lines.join("\n")).toContain("BASELINE_UNREADABLE")
	})
})

describe("a pull request that compares against a baseline", () => {
	test("fails only on the drift the baseline does not already have", async () => {
		const baseline = [
			INDEX,
			page("tx.mdx", "## `traj tx add <id>`\n"),
			page("fi.mdx", "- `--scenario <string>` — the Scenario.\n"),
		]
		const current = [INDEX, page("tx.mdx", "## `traj tx add <id>`\n"), page("fi.mdx", "")]
		const fake = fakeDeps({ pages: current, baselinePages: baseline })
		expect(await main(["--baseline", "origin/main"], fake.deps)).toBe(1)
		expect(fake.lines).toContain(
			`${COMMAND_REFERENCE_ROOT}/tx.mdx: tx add is missing --from (traj 0.2.0 accepts it) — already drifted on origin/main (not failing)`,
		)
		expect(fake.lines.join("\n")).toContain(`${COMMAND_REFERENCE_ROOT}/fi.mdx`)
		expect(fake.lines.join("\n")).toContain("fi is missing --scenario")
		expect(fake.lines.at(-1)).toContain("1 new problem against traj 0.2.0")
	})

	test("passes when every problem was already on the baseline", async () => {
		const fake = fakeDeps({
			pages: [INDEX, TX, page("fi.mdx", "")],
			baselinePages: [INDEX, TX, page("fi.mdx", "")],
		})
		expect(await main(["--baseline", "abc123"], fake.deps)).toBe(0)
		expect(fake.lines.at(-1)).toContain("no new problems")
		expect(fake.lines.at(-1)).toContain("1 problem already drifted")
	})
})

describe("the check's arguments", () => {
	test("an unusable argument is refused as USAGE_INVALID", () => {
		expect(() => parseArguments(["--pages", "somewhere"])).toThrow(
			expect.objectContaining({ code: "USAGE_INVALID" }),
		)
	})

	test("an unknown argument exits 2 with the usage line", async () => {
		const fake = fakeDeps()
		expect(await main(["--pages", "somewhere"], fake.deps)).toBe(2)
		expect(fake.lines.join("\n")).toContain("USAGE_INVALID")
	})
})

describe("the offline deploy gate", () => {
	test("`bun run check` does not run the command-reference check", () => {
		const manifest = JSON.parse(readFileSync("package.json", "utf8")) as {
			scripts: Record<string, string>
		}
		expect(manifest.scripts["check"]).not.toContain("check:command-reference")
		expect(manifest.scripts["check:command-reference"]).toBe(
			"bun scripts/check-command-reference.ts",
		)
	})
})
