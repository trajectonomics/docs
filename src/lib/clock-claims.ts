import type { ContentFile } from "./content-pages"
import { OPERATOR_TAB_CONTENT } from "./release-truth"

/** One rule of the clock-claim check; one value per way a page can make the claim. */
export type ClockClaimRule =
	| "reads-no-clock"
	| "never-reads-a-clock"
	| "never-reads-the-clock"
	| "has-no-clock"

/** An Operator-tab page that claims the CLI has no clock. */
export interface ClockClaimProblem {
	readonly rule: ClockClaimRule
	readonly file: string
	readonly detail: string
}

/** `phrase` as a pattern that accepts any whitespace between its words and any capitalisation. */
function whitespaceTolerant(phrase: string): RegExp {
	const words = phrase.split(" ").map((word) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
	return new RegExp(words.join("\\s+"), "gi")
}

/** Each way a page claims the CLI has no clock, with the phrase it writes and the rule it breaks. */
const CLAIMS: readonly { readonly rule: ClockClaimRule; readonly pattern: RegExp }[] = [
	{ rule: "reads-no-clock", pattern: whitespaceTolerant("reads no clock") },
	{ rule: "never-reads-a-clock", pattern: whitespaceTolerant("never reads a clock") },
	{ rule: "never-reads-the-clock", pattern: whitespaceTolerant("never reads the clock") },
	{ rule: "has-no-clock", pattern: whitespaceTolerant("has no clock") },
]

/** The claim one match makes, on one line, so a maintainer reads what the page wrote. */
function clauseOf(match: string): string {
	return match.replace(/\s+/g, " ")
}

/** Every claim in `file` that the CLI has no clock; empty outside the Operator tab. */
function claimProblems(file: ContentFile): readonly ClockClaimProblem[] {
	if (!file.path.startsWith(`${OPERATOR_TAB_CONTENT}/`)) return []
	return CLAIMS.flatMap(({ rule, pattern }) =>
		[...file.content.matchAll(pattern)].map((match) => ({
			rule,
			file: file.path,
			detail: `claims the CLI has no clock: "${clauseOf(match[0])}"`,
		})),
	)
}

/** Every Operator-tab page that claims the CLI has no clock; empty when the copy holds the boundary. */
export function checkClockClaims(files: readonly ContentFile[]): readonly ClockClaimProblem[] {
	return files.flatMap(claimProblems)
}
