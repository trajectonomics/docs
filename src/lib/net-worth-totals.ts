/** One net-worth figure: an amount in a currency, as the CLI prints it. */
export interface NetWorthTotal {
	readonly currency: string
	readonly amount: string
}

/** A total array that is not readable, and what a maintainer will see; the reader supplies the page. */
interface TotalProblem {
	readonly problem: { readonly rule: "total-entry" | "currency-repeated"; readonly detail: string }
}

/** The `{currency, amount}` entries of one page's total, or the rule that stops them being read. */
export function readEntries(
	field: string,
	total: readonly unknown[],
): { readonly kind: "total"; readonly total: readonly NetWorthTotal[] } | TotalProblem {
	const entries: NetWorthTotal[] = []
	for (const entry of total) {
		const fields = (typeof entry === "object" && entry !== null ? entry : {}) as Record<
			string,
			unknown
		>
		const { currency, amount } = fields
		if (typeof currency !== "string" || typeof amount !== "string") {
			return {
				problem: {
					rule: "total-entry",
					detail: `a "${field}" entry is not a currency and an amount`,
				},
			}
		}
		if (entries.some((other) => other.currency === currency)) {
			return {
				problem: {
					rule: "currency-repeated",
					detail: `"${field}" prints ${currency} more than once`,
				},
			}
		}
		entries.push({ currency, amount })
	}
	return { kind: "total", total: entries }
}

/** The figure each currency prints on one page. */
export function figuresByCurrency(total: readonly NetWorthTotal[]): ReadonlyMap<string, string> {
	return new Map(total.map((entry) => [entry.currency, entry.amount]))
}

/** Whether both totals print the same figure for every currency, whatever order either lists. */
export function sameFigures(
	left: readonly NetWorthTotal[],
	right: readonly NetWorthTotal[],
): boolean {
	const leftFigures = figuresByCurrency(left)
	const rightFigures = figuresByCurrency(right)
	return (
		leftFigures.size === rightFigures.size &&
		[...leftFigures].every(([currency, amount]) => rightFigures.get(currency) === amount)
	)
}

/** The figures a total array prints, as a maintainer reads them. */
export function figuresOf(total: readonly NetWorthTotal[]): string {
	return total.map((entry) => `${entry.currency} ${entry.amount}`).join(", ")
}
