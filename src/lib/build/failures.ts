/** Stable codes for every way the built Docs Portal can fail verification. One code per rule. */
export type BuildFailureCode =
	| "NOT_FOUND_PAGE_MISSING"
	| "NOT_FOUND_HEADER_MISSING"
	| "NOT_FOUND_SEARCH_MISSING"
	| "NOT_FOUND_LINK_MISSING"
	| "OPERATOR_TAB_PAGE_MISSING"
	| "SEARCH_INDEX_MISSING"
	| "SEARCH_INDEX_INVALID"
	| "SEARCH_INDEX_EMPTY"
	| "SEARCH_INDEX_PAGE_MISSING"
	| "LANDING_PAGE_MISSING"
	| "LANDING_PAGE_REDIRECT"
	| "LANDING_PAGE_LINKS"
	| "LANDING_PAGE_INDEXED"
	| "REDIRECT_TO_OPERATOR_TAB"
	| "HEADER_TAB_LINK_MISSING"
	| "HEADER_TAB_NOT_CURRENT"
	| "HEADER_TAB_OTHER_CURRENT"
	| "SIDEBAR_TAB_TITLE_LINK"
	| "TOC_PLACEHOLDER_PRESENT"
	| "PLACEHOLDER_COPY_PRESENT"

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
