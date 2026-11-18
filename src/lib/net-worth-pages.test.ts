import { describe, expect, test } from "bun:test"

const CONTENT_ROOT = "src/content/docs"

/** The Operator tab's two pages that report net worth, and the total field each one prints. */
const NET_WORTH_PAGES = [
	{ path: "cli/commands/balance.mdx", field: "netWorth" },
	{ path: "cli/commands/report.mdx", field: "totals" },
] as const

/** The heading the `report` page keeps its net-worth sample under. */
const NET_WORTH_HEADING = "## `traj report networth`"

/** A rule the two net-worth pages must keep; one value per way a reader can lose the total. */
type NetWorthProblem = "sample-missing" | "total-missing" | "total-entry" | "totals-disagree"

/** One page's sample: the `asOf` and `rows` every report prints, and the net-worth total. */
interface Sample {
	readonly asOf: string
	readonly rows: readonly unknown[]
	readonly total: readonly unknown[]
}

/** Every ```json fenced block in `content`, in source order. */
function jsonBlocks(content: string): readonly string[] {
	return [...content.matchAll(/^```json\n([\s\S]*?)^```$/gm)].flatMap((match) =>
		match[1] === undefined ? [] : [match[1]],
	)
}

/** The text of the `## ` section that starts with `heading`, up to the next `## ` heading. */
function section(content: string, heading: string): string {
	const start = content.indexOf(`\n${heading}\n`)
	if (start < 0) return ""
	const end = content.indexOf("\n## ", start + heading.length + 1)
	return end < 0 ? content.slice(start) : content.slice(start, end)
}

/** The JSON object among `blocks` whose `asOf` and `rows` mark it as a report's output. */
function reportObject(blocks: readonly string[]): Record<string, unknown> | undefined {
	for (const block of blocks) {
		let parsed: unknown
		try {
			parsed = JSON.parse(block)
		} catch {
			continue
		}
		if (typeof parsed !== "object" || parsed === null) continue
		const record = parsed as Record<string, unknown>
		if (typeof record["asOf"] === "string" && Array.isArray(record["rows"])) {
			return record
		}
	}
	return undefined
}

/** The sample `content` shows when `total` is the field carrying the total, or the rule it breaks. */
function sampleOf(content: string, field: string): Sample | NetWorthProblem {
	const object = reportObject(jsonBlocks(content))
	if (object === undefined) return "sample-missing"
	const total = object[field]
	if (!Array.isArray(total)) return "total-missing"
	for (const entry of total) {
		const record = typeof entry === "object" && entry !== null ? entry : {}
		if (typeof record["currency"] !== "string" || typeof record["amount"] !== "string") {
			return "total-entry"
		}
	}
	return { asOf: object["asOf"] as string, rows: object["rows"] as unknown[], total }
}

/** The `currency` and `amount` each total entry carries, in order, so two samples compare by figure. */
function figuresOf(sample: Sample): readonly string[] {
	return sample.total.map((entry) => {
		const record = entry as Record<string, string>
		return `${record["currency"]} ${record["amount"]}`
	})
}

/** Everything wrong with the two pages' samples; empty when each names its total and the figures agree. */
function netWorthProblems(balance: string, report: string): readonly NetWorthProblem[] {
	const problems: NetWorthProblem[] = []
	const texts = [balance, section(report, NET_WORTH_HEADING)]
	const samples: Sample[] = []
	for (const [index, page] of NET_WORTH_PAGES.entries()) {
		const sample = sampleOf(texts[index] ?? "", page.field)
		if (typeof sample === "string") {
			problems.push(sample)
		} else {
			samples.push(sample)
		}
	}
	const [balanceSample, reportSample] = samples
	if (
		balanceSample !== undefined &&
		reportSample !== undefined &&
		figuresOf(balanceSample).join() !== figuresOf(reportSample).join()
	) {
		problems.push("totals-disagree")
	}
	return problems
}

/** `content` with the first entry inside its `${field}` array carrying `entry`'s text instead. */
function withTotalEntry(content: string, field: string, entry: string): string {
	const start = content.indexOf(`"${field}": [`)
	const end = content.indexOf("]", start)
	if (start < 0 || end < 0) return content
	const total = content.slice(start, end)
	const replaced = total.replace(/"currency": "[^"]*",\n\s*"amount": "[^"]*"/, entry)
	return `${content.slice(0, start)}${replaced}${content.slice(end)}`
}

async function pageContent(path: string): Promise<string> {
	return Bun.file(`${CONTENT_ROOT}/${path}`).text()
}

const [balancePage, reportPage] = await Promise.all(
	NET_WORTH_PAGES.map((page) => pageContent(page.path)),
)

describe("the net-worth command pages", () => {
	test("each page shows one sample output whose total field carries net worth, and the totals agree", () => {
		expect(netWorthProblems(balancePage ?? "", reportPage ?? "")).toEqual([])
	})

	test("both samples state the same As-of and carry 1,000.00 THB as their net worth", () => {
		const balance = sampleOf(balancePage ?? "", "netWorth") as Sample
		const report = sampleOf(section(reportPage ?? "", NET_WORTH_HEADING), "totals") as Sample

		expect(balance.asOf).toBe("2026-03-31")
		expect(report.asOf).toBe("2026-03-31")
		expect(balance.rows.length).toBeGreaterThan(0)
		expect(report.rows.length).toBeGreaterThan(0)
		expect(figuresOf(balance)).toEqual(["THB 1000.00"])
		expect(figuresOf(report)).toEqual(["THB 1000.00"])
	})

	test("a page that loses its sample is reported as sample-missing", () => {
		expect(netWorthProblems("No sample here.", reportPage ?? "")).toEqual(["sample-missing"])
	})

	test("a page whose total array is named another field is reported as total-missing", () => {
		const renamed = (balancePage ?? "").replace('"netWorth": [', '"total": [')

		expect(renamed).not.toBe(balancePage)
		expect(netWorthProblems(renamed, reportPage ?? "")).toEqual(["total-missing"])
	})

	test("a total entry that is not a currency and an amount is reported as total-entry", () => {
		const shape = withTotalEntry(
			balancePage ?? "",
			"netWorth",
			'"currency": "THB",\n      "value": "1000.00"',
		)

		expect(shape).not.toBe(balancePage)
		expect(netWorthProblems(shape, reportPage ?? "")).toEqual(["total-entry"])
	})

	test("two samples that disagree are reported as totals-disagree", () => {
		const other = withTotalEntry(
			balancePage ?? "",
			"netWorth",
			'"currency": "THB",\n      "amount": "2000.00"',
		)

		expect(other).not.toBe(balancePage)
		expect(netWorthProblems(other, reportPage ?? "")).toEqual(["totals-disagree"])
	})

	test("a report pnl sample cannot stand in for the net-worth sample", () => {
		const sample = jsonBlocks(reportPage ?? "")[0] ?? ""
		const pnlOnly = [
			"`traj report` reports on the ledger.",
			"",
			NET_WORTH_HEADING,
			"",
			"Show the assets and liabilities behind net worth at a date.",
			"",
			"## `traj report pnl`",
			"",
			"```json",
			sample.trim(),
			"```",
		].join("\n")

		expect(netWorthProblems(balancePage ?? "", pnlOnly)).toEqual(["sample-missing"])
	})
})
