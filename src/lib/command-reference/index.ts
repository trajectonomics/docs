/** The command-reference check's public surface: the release rules and the page-section parser. */

export { type ContentFile, PAGE_EXTENSIONS } from "../content-pages"
export { checkCommandReference, problemKey } from "./problems"
export {
	COMMAND_REFERENCE_ROOT,
	GLOBAL_LEAF,
	GLOBAL_OPTIONS_HEADING,
	pageSections,
} from "./sections"
export type {
	CommandReferenceProblem,
	CommandReferenceRule,
	ReleaseLeaf,
	ReleaseSnapshot,
} from "./types"
