import { linkStructureProblems } from "./content-links"
import { navigationStructureProblems } from "./content-navigation"
import type { ContentFile } from "./content-pages"

/** A structural rule the Docs Portal content tree must keep; one value per rule that can fail. */
export type ContentStructureRule =
	| "tab-landing-page"
	| "tab-navigation"
	| "tab-listed"
	| "package-landing-page"
	| "package-navigation"
	| "package-listed"
	| "navigation-entry"
	| "internal-link"

/** One broken rule and what is missing or unresolvable. */
export interface ContentStructureProblem {
	readonly rule: ContentStructureRule
	readonly detail: string
}

/** Every structural rule the content tree breaks; empty when the Docs Portal structure holds. */
export function checkContentStructure(
	files: readonly ContentFile[],
): readonly ContentStructureProblem[] {
	return [...navigationStructureProblems(files), ...linkStructureProblems(files)]
}

export type { ContentFile } from "./content-pages"
