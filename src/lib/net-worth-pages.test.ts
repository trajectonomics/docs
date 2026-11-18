import { describe, expect, test } from "bun:test"
import type { ContentFile } from "./content-pages"
import { readContentTree } from "./content-tree-support"
import { checkNetWorthPages } from "./net-worth-pages"

const BALANCE = "cli/commands/balance.mdx"
const REPORT = "cli/commands/report.mdx"

const tree = await readContentTree()

/** The rules `files` break, so a test names the rule rather than its wording. */
function rulesOf(files: readonly ContentFile[]): readonly string[] {
	return checkNetWorthPages(files).map((problem) => problem.rule)
}

/** The content tree with one page's text replaced. */
function withPage(path: string, content: string): ContentFile[] {
	return tree.map((file) => (file.path === path ? { ...file, content } : file))
}

function page(path: string): string {
	return tree.find((file) => file.path === path)?.content ?? ""
}

/** `content` with the first entry inside its `${field}` array carrying `entry`'s fields instead. */
function withTotalEntry(content: string, field: string, entry: string): string {
	const start = content.indexOf(`"${field}": [`)
	const end = content.indexOf("]", start)
	if (start < 0 || end < 0) return content
	const total = content
		.slice(start, end)
		.replace(/"currency": "[^"]*",\n\s*"amount": "[^"]*"/, entry)
	return `${content.slice(0, start)}${total}${content.slice(end)}`
}

/** `content` with the array under `${field}` replaced by `entries`, the array written on one line. */
function withField(content: string, field: string, entries: string): string {
	const start = content.indexOf(`"${field}": [`)
	if (start < 0) return content
	const end = content.indexOf("]", start)
	if (end < 0) return content
	return `${content.slice(0, start)}"${field}": ${entries}${content.slice(end + 1)}`
}

/** A `report` page whose only sample sits in its `pnl` section. */
const REPORT_WITH_SAMPLE_ONLY_IN_PNL = [
	"`traj report` reports on the ledger.",
	"",
	"## `traj report networth`",
	"",
	"Show the assets and liabilities behind net worth at a date.",
	"",
	"## `traj report pnl`",
	"",
	"```json",
	'{"asOf": "2026-03-31", "rows": [], "totals": [{"currency": "THB", "amount": "1000.00"}]}',
	"```",
].join("\n")

describe("the net-worth command pages", () => {
	test("the two pages show sample outputs whose totals agree", () => {
		expect(checkNetWorthPages(tree)).toEqual([])
	})

	test("both samples state the same As-of", () => {
		for (const content of [page(BALANCE), page(REPORT)]) {
			expect(content).toMatch(/"asOf"\s*:\s*"2026-03-31"/)
		}
	})

	test("a page that prints another total is reported against the figure the other page prints", () => {
		const other = '"currency": "THB",\n      "amount": "2000.00"'
		const fromBalance = checkNetWorthPages(
			withPage(BALANCE, withTotalEntry(page(BALANCE), "netWorth", other)),
		)
		const fromReport = checkNetWorthPages(
			withPage(REPORT, withTotalEntry(page(REPORT), "totals", other)),
		)

		expect(fromBalance.map((problem) => problem.rule)).toEqual(["totals-disagree"])
		expect(fromReport.map((problem) => problem.rule)).toEqual(["totals-disagree"])
		expect(fromBalance[0]?.detail).toContain("THB 1000.00")
		expect(fromReport[0]?.detail).toContain("THB 1000.00")
		expect(fromBalance[0]?.detail).toContain("THB 2000.00")
		expect(fromReport[0]?.detail).toContain("THB 2000.00")
		expect([fromBalance[0]?.detail, fromReport[0]?.detail].join()).toContain(BALANCE)
		expect([fromBalance[0]?.detail, fromReport[0]?.detail].join()).toContain(REPORT)
		expect([fromBalance[0]?.file, fromReport[0]?.file]).toEqual([REPORT, REPORT])
	})

	test("a page without a sample output is reported, naming that page", () => {
		const problems = checkNetWorthPages(withPage(BALANCE, "No sample here."))

		expect(problems.map((problem) => problem.rule)).toEqual(["sample-missing"])
		expect(problems.map((problem) => problem.file)).toEqual([BALANCE])
	})

	test("a page whose net-worth section is gone is reported, naming that page", () => {
		const renamed = page(REPORT).replace("## `traj report networth`", "## Net worth")
		const problems = checkNetWorthPages(withPage(REPORT, renamed))

		expect(renamed).not.toBe(page(REPORT))
		expect(problems.map((problem) => problem.rule)).toEqual(["section-missing"])
		expect(problems.map((problem) => problem.file)).toEqual([REPORT])
	})

	test("a page that carries its total under another field is reported", () => {
		const renamed = page(BALANCE).replace('"netWorth": [', '"total": [')

		expect(renamed).not.toBe(page(BALANCE))
		expect(rulesOf(withPage(BALANCE, renamed))).toEqual(["total-missing"])
	})

	test("a total entry that is not a currency and an amount is reported", () => {
		const shape = withTotalEntry(
			page(BALANCE),
			"netWorth",
			'"currency": "THB",\n      "value": "1000.00"',
		)

		expect(shape).not.toBe(page(BALANCE))
		expect(rulesOf(withPage(BALANCE, shape))).toEqual(["total-entry"])
	})

	test("a net-worth section that ends the page is still read", () => {
		const ending = page(REPORT).slice(0, page(REPORT).indexOf("## `traj report pnl`")).trimEnd()

		expect(ending).not.toContain("## `traj report pnl`")
		expect(rulesOf(withPage(REPORT, ending))).toEqual([])
	})

	test("a sample in the report pnl section does not stand in for the net-worth sample", () => {
		expect(rulesOf(withPage(REPORT, REPORT_WITH_SAMPLE_ONLY_IN_PNL))).toEqual(["sample-missing"])
	})

	test("a page that prints one currency twice is reported, so a duplicate cannot read as agreement", () => {
		const repeated = '[{"currency":"THB","amount":"500.00"},{"currency":"THB","amount":"1000.00"}]'
		const once = '[{"currency":"THB","amount":"1000.00"}]'
		const files = [
			{ path: BALANCE, content: withField(page(BALANCE), "netWorth", repeated) },
			{ path: REPORT, content: withField(page(REPORT), "totals", once) },
		]
		const problems = checkNetWorthPages(files)

		expect(problems.map((problem) => problem.rule)).toEqual(["currency-repeated"])
		expect(problems.map((problem) => problem.file)).toEqual([BALANCE])
	})
})
