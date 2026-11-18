import type { ContentFile } from "./content-pages"
import { jsonSample, sectionContent } from "./content-sections"
import type { NetWorthTotal } from "./net-worth-totals"
import { figuresOf, readEntries, sameFigures } from "./net-worth-totals"

/** A rule the two net-worth pages must keep; one value per way a reader can lose the total. */
export type NetWorthPageRule =
	| "section-missing"
	| "sample-missing"
	| "total-missing"
	| "total-entry"
	| "currency-repeated"
	| "totals-disagree"

/** One rule a net-worth page breaks, the page it breaks it on, and what a maintainer will see. */
export interface NetWorthPageProblem {
	readonly rule: NetWorthPageRule
	readonly file: string
	readonly detail: string
}

/** One page that prints net worth: the field carrying its total and, when it has several, its section. */
type NetWorthPage = { readonly path: string; readonly field: string; readonly section?: string }

/** The Operator tab's two pages that report net worth; a page without `section` prints in its whole text. */
const NET_WORTH_PAGES: readonly NetWorthPage[] = [
	{ path: "cli/commands/balance.mdx", field: "netWorth" },
	{ path: "cli/commands/report.mdx", field: "totals", section: "## `traj report networth`" },
]

/** One page's total, or the rule that stops the page printing one. */
type TotalRead =
	| { readonly kind: "total"; readonly total: readonly NetWorthTotal[] }
	| { readonly kind: "problem"; readonly problem: NetWorthPageProblem }

/** The total `page` prints, or the rule that stops it printing one. */
function readTotal(page: NetWorthPage, content: string): TotalRead {
	const problem = (rule: NetWorthPageRule, detail: string): TotalRead => ({
		kind: "problem",
		problem: { rule, file: page.path, detail },
	})
	const scoped = page.section === undefined ? content : sectionContent(content, page.section)
	if (scoped === undefined) return problem("section-missing", `no "${page.section}" section`)
	const object = jsonSample(scoped)
	if (object === undefined)
		return problem("sample-missing", "no sample output carrying asOf and rows")
	const total: unknown = object[page.field]
	if (!Array.isArray(total)) return problem("total-missing", `no "${page.field}" array`)
	const read = readEntries(page.field, total)
	return "problem" in read
		? { kind: "problem", problem: { ...read.problem, file: page.path } }
		: read
}

/** Every rule the two net-worth pages break; empty when each prints a total and the two agree. */
export function checkNetWorthPages(files: readonly ContentFile[]): readonly NetWorthPageProblem[] {
	const problems: NetWorthPageProblem[] = []
	const totals: { readonly file: string; readonly total: readonly NetWorthTotal[] }[] = []
	for (const page of NET_WORTH_PAGES) {
		const content = files.find((file) => file.path === page.path)?.content ?? ""
		const read = readTotal(page, content)
		if (read.kind === "problem") problems.push(read.problem)
		else totals.push({ file: page.path, total: read.total })
	}
	const [left, right] = totals
	if (left !== undefined && right !== undefined && !sameFigures(left.total, right.total)) {
		const detail = `${right.file} prints ${figuresOf(right.total)}, but ${left.file} prints ${figuresOf(left.total)}`
		problems.push({ rule: "totals-disagree", file: right.file, detail })
	}
	return problems
}
