/** The build check's public surface: one function over the files of the built Docs Portal. */

export type { BuiltFile } from "./built-files"
export { checkBuild } from "./check-build"
export type { BuildFailure, BuildFailureCode } from "./failures"
export { checkRequiredPages } from "./required-pages"
export { checkSearchIndex, SEARCH_INDEX_FILE } from "./search-index"
