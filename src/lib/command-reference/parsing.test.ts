import { describe, expect, test } from "bun:test"
import { INDEX, page, release } from "./fixtures"
import { checkCommandReference, problemKey } from "./index"

describe("a leaf-claiming heading", () => {
	test("is ignored when it names no leaf", () => {
		const tx = page(
			"tx.mdx",
			"## `traj tx add`\n\n- `--from <string>` — source.\n\n## Decisions\n\n- [ADR 0001](https://example.com)\n",
		)
		expect(
			checkCommandReference(release([{ name: "tx add", flags: ["--from"] }]), [INDEX, tx]),
		).toEqual([])
	})

	test("strips argument placeholders before matching a leaf", () => {
		const tx = page("tx.mdx", "## `traj tx amend <id>`\n\n- `--date <string>` — date.\n")
		expect(
			checkCommandReference(release([{ name: "tx amend", flags: ["--date"] }]), [INDEX, tx]),
		).toEqual([])
	})
})

describe("a page's flags", () => {
	test("accept a global flag in a leaf's section", () => {
		const tx = page(
			"tx.mdx",
			"## `traj tx add`\n\n- `--from <string>` — source.\n- `--json` — print JSON.\n",
		)
		expect(
			checkCommandReference(release([{ name: "tx add", flags: ["--from"] }]), [INDEX, tx]),
		).toEqual([])
	})

	test("are not read from a positional bullet or a bash example fence", () => {
		const inspect = page(
			"inspect.mdx",
			["- `[table]` — one table to show.", "", "```bash", "traj inspect --all", "```"].join("\n"),
		)
		const problems = checkCommandReference(release([{ name: "inspect", flags: ["--all"] }]), [
			INDEX,
			inspect,
		])
		expect(problems.map((problem) => [problem.rule, problem.flag])).toEqual([
			["flag-missing", "--all"],
		])
	})

	test("are read from a single-command page with no leaf heading", () => {
		const fi = page("fi.mdx", "- `--scenario <string>` — the Scenario.\n")
		expect(
			checkCommandReference(release([{ name: "fi", flags: ["--scenario"] }]), [INDEX, fi]),
		).toEqual([])
	})
})

describe("a group page with two leaves", () => {
	test("reports only the leaf whose flags drift", () => {
		const tx = page(
			"tx.mdx",
			"## `traj tx add`\n\n- `--from <string>` — source.\n\n## `traj tx void <id>`\n\n- `--memory` — a flag the release rejects.\n",
		)
		const leaves = [
			{ name: "tx add", flags: ["--from"] },
			{ name: "tx void", flags: ["--date"] },
		]
		const problems = checkCommandReference(release(leaves), [INDEX, tx])
		expect(problems.map((problem) => [problem.rule, problem.leaf, problem.flag])).toEqual([
			["flag-missing", "tx void", "--date"],
			["flag-unknown", "tx void", "--memory"],
		])
	})
})

describe("a problem's identity", () => {
	test("matches on rule, page, leaf and flag, not on the message", () => {
		const problems = checkCommandReference(release([{ name: "fi", flags: ["--scenario"] }]), [
			INDEX,
		])
		expect(problemKey(problems[0]!)).toBe(
			problemKey({ ...problems[0]!, detail: "another release, another wording" }),
		)
	})
})
