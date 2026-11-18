import type { ContentFile } from "./content-pages"

/** A rule the two net-worth pages must keep; one value per way a reader can lose the total. */
export type NetWorthPageRule =
	| "sample-missing"
	| "total-missing"
	| "total-entry"
	| "totals-disagree"

/** One rule a net-worth page breaks, the page it breaks it on, and what a maintainer will see. */
export interface NetWorthPageProblem {
	readonly rule: NetWorthPageRule
	readonly file: string
	readonly detail: string
}

/** One net-worth figure: an amount in a currency, as the CLI prints it. */
interface NetWorthTotal {
	readonly currency: string
	readonly amount: string
}

/** One page that prints net worth: the field carrying its total and the section it prints in. */
type NetWorthPage = { readonly path: string; readonly field: string; readonly section: string }

/** The Operator tab's two pages that report net worth; an empty section means the whole page. */
const NET_WORTH_PAGES: readonly NetWorthPage[] = [
	{ path: "cli/commands/balance.mdx", field: "netWorth", section: "" },
	{ path: "cli/commands/report.mdx", field: "totals", section: "## `traj report networth`" },
]

/** `content` scoped to the `## ` section that starts with `page.section`. */
function scoped(page: NetWorthPage, content: string): string {
	if (page.section === "") return content
	const start = content.indexOf(`\n${page.section}\n`)
	if (start < 0) return ""
	const end = content.indexOf("\n## ", start + page.section.length + 1)
	return end < 0 ? content.slice(start) : content.slice(start, end)
}

/** The first `json` block in `content` carrying the `asOf` and `rows` every report prints. */
function reportOutput(content: string): Record<string, unknown> | undefined {
	for (const match of content.matchAll(/^```json\n([\s\S]*?)^```$/gm)) {
		try {
			const parsed: unknown = JSON.parse(match[1] ?? "")
			if (typeof parsed !== "object" || parsed === null) continue
			const { asOf, rows } = parsed as Record<string, unknown>
			if (typeof asOf === "string" && Array.isArray(rows)) return parsed as Record<string, unknown>
		} catch {
			// A `json` block that does not parse is not a sample, so keep looking.
		}
	}
	return undefined
}

/** The total `page` prints, or the rule that stops it printing one. */
function readTotal(
	page: NetWorthPage,
	content: string,
): { readonly total?: readonly NetWorthTotal[]; readonly problem?: NetWorthPageProblem } {
	const problem = (rule: NetWorthPageRule, detail: string) => ({
		problem: { rule, file: page.path, detail },
	})
	const object = reportOutput(scoped(page, content))
	if (object === undefined)
		return problem("sample-missing", "no sample output carrying asOf and rows")
	const total: unknown = object[page.field]
	if (!Array.isArray(total)) return problem("total-missing", `no "${page.field}" array`)
	const entries: NetWorthTotal[] = []
	for (const entry of total) {
		const fields = (typeof entry === "object" && entry !== null ? entry : {}) as Record<
			string,
			unknown
		>
		const { currency, amount } = fields
		if (typeof currency !== "string" || typeof amount !== "string") {
			return problem("total-entry", `a "${page.field}" entry is not a currency and an amount`)
		}
		entries.push({ currency, amount })
	}
	return { total: entries }
}

/** Whether two total arrays print the same figure for every entry. */
function sameFigures(left: readonly NetWorthTotal[], right: readonly NetWorthTotal[]): boolean {
	return (
		left.length === right.length &&
		left.every((entry, index) => {
			const other = right[index]
			return (
				other !== undefined && entry.currency === other.currency && entry.amount === other.amount
			)
		})
	)
}

/** The figures a total array prints, as a maintainer reads them. */
function figuresOf(total: readonly NetWorthTotal[]): string {
	return total.map((entry) => `${entry.currency} ${entry.amount}`).join(", ")
}

/** Every rule the two net-worth pages break; empty when each prints a total and the two agree. */
export function checkNetWorthPages(files: readonly ContentFile[]): readonly NetWorthPageProblem[] {
	const problems: NetWorthPageProblem[] = []
	const totals: { readonly file: string; readonly total: readonly NetWorthTotal[] }[] = []
	for (const page of NET_WORTH_PAGES) {
		const content = files.find((file) => file.path === page.path)?.content ?? ""
		const { total, problem } = readTotal(page, content)
		if (problem !== undefined) problems.push(problem)
		else if (total !== undefined) totals.push({ file: page.path, total })
	}
	const [left, right] = totals
	if (left !== undefined && right !== undefined && !sameFigures(left.total, right.total)) {
		const detail = `${right.file} prints ${figuresOf(right.total)}, but ${left.file} prints ${figuresOf(left.total)}`
		problems.push({ rule: "totals-disagree", file: right.file, detail })
	}
	return problems
}
