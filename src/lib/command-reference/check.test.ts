import { describe, expect, test } from "bun:test"
import { GLOBALS, INDEX, page, release, TX_ADD, TX_VOID } from "./fixtures"
import { COMMAND_REFERENCE_ROOT, checkCommandReference } from "./index"

describe("a command reference that matches the release", () => {
	test("reports no problem", () => {
		const files = [INDEX, TX_ADD, page("fi.mdx", "- `--scenario <string>` — the Scenario.")]
		const leaves = [
			{ name: "tx add", flags: ["--from", "--to"] },
			{ name: "fi", flags: ["--scenario"] },
		]
		expect(checkCommandReference(release(leaves), files)).toEqual([])
	})
})

describe("a released leaf with no page", () => {
	test("is reported as leaf-page-missing with the page it should have", () => {
		const problems = checkCommandReference(release([{ name: "fi", flags: [] }]), [INDEX])
		expect(problems.map((problem) => [problem.rule, problem.file, problem.leaf])).toEqual([
			["leaf-page-missing", `${COMMAND_REFERENCE_ROOT}/fi.mdx`, "fi"],
		])
	})
})

describe("a released leaf whose page has no section for it", () => {
	test("is reported as leaf-page-missing against the page that should document it", () => {
		const leaves = [
			{ name: "tx add", flags: ["--from", "--to"] },
			{ name: "tx remove", flags: [] },
		]
		const problems = checkCommandReference(release(leaves), [INDEX, TX_ADD])
		expect(
			problems
				.filter((problem) => problem.rule === "leaf-page-missing")
				.map((problem) => problem.leaf),
		).toEqual(["tx remove"])
	})
})

describe("a leaf-claiming heading", () => {
	test("is reported as leaf-unknown when the release does not have the leaf", () => {
		const problems = checkCommandReference(
			release([{ name: "tx add", flags: ["--from", "--to"] }]),
			[INDEX, TX_ADD, TX_VOID],
		)
		expect(problems.map((problem) => [problem.rule, problem.leaf, problem.file])).toEqual([
			["leaf-unknown", "tx void", `${COMMAND_REFERENCE_ROOT}/tx.mdx`],
		])
	})
})

describe("a released flag", () => {
	test("is reported as flag-missing when its leaf's section has no bullet for it", () => {
		const leaves = [{ name: "tx add", flags: ["--from", "--to", "--memo"] }]
		const problems = checkCommandReference(release(leaves), [INDEX, TX_ADD])
		expect(problems.map((problem) => [problem.rule, problem.leaf, problem.flag])).toEqual([
			["flag-missing", "tx add", "--memo"],
		])
		expect(problems[0]?.detail).toContain("--memo")
		expect(problems[0]?.detail).toContain("0.2.0")
	})
})

describe("a flag bullet", () => {
	test("is reported as flag-unknown when the release rejects the flag", () => {
		const tx = page(
			"tx.mdx",
			"## `traj tx add`\n\n- `--from <string>` — source.\n- `--to <string>` — destination.\n- `--template` — a template.\n",
		)
		const problems = checkCommandReference(
			release([{ name: "tx add", flags: ["--from", "--to"] }]),
			[INDEX, tx],
		)
		expect(problems.map((problem) => [problem.rule, problem.leaf, problem.flag])).toEqual([
			["flag-unknown", "tx add", "--template"],
		])
	})
})

describe("the global options", () => {
	test("are reported as flag-missing when the index page does not document one", () => {
		const index = page("index.mdx", "## Global options\n\n- `--json` — print JSON.\n")
		const problems = checkCommandReference(release([]), [index])
		expect(problems.map((problem) => [problem.rule, problem.leaf, problem.flag])).toEqual([
			["flag-missing", "traj", "-h"],
			["flag-missing", "traj", "--help"],
			["flag-missing", "traj", "-v"],
			["flag-missing", "traj", "--version"],
		])
	})

	test("are reported as flag-unknown when the index page names a flag the release rejects", () => {
		const index = page(
			"index.mdx",
			`## Global options\n\n${GLOBALS.map((flag) => `- \`${flag}\` — accepted.`).join("\n")}\n- \`--quiet\` — hush.\n`,
		)
		const problems = checkCommandReference(release([]), [index])
		expect(problems.map((problem) => [problem.rule, problem.leaf, problem.flag])).toEqual([
			["flag-unknown", "traj", "--quiet"],
		])
	})
})
