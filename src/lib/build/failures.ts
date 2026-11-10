/** Stable codes for every way the built Docs Portal can fail verification. One code per rule. */
export type BuildFailureCode =
	| "NOT_FOUND_PAGE_MISSING"
	| "OPERATOR_TAB_PAGE_MISSING"
	| "SEARCH_INDEX_MISSING"
	| "SEARCH_INDEX_INVALID"
	| "SEARCH_INDEX_EMPTY"

/** One failed build check: the rule's code, the file it concerns and a line a maintainer can act on. */
export interface BuildFailure {
	readonly code: BuildFailureCode
	readonly path: string
	readonly message: string
}

/** A frozen failure, so a caller cannot edit a check's verdict. */
export function buildFailure(code: BuildFailureCode, path: string, message: string): BuildFailure {
	return Object.freeze({ code, path, message })
}
