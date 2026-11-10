import { SEARCH_INDEX_PATH } from "../tabs"
import type { BuiltFile } from "./built-files"
import { fileAt } from "./built-files"
import type { BuildFailure } from "./failures"
import { buildFailure } from "./failures"

/** Path of the static search index in the build output, one segment below the assets root. */
export const SEARCH_INDEX_FILE = SEARCH_INDEX_PATH.slice(1)

/** The part of Fumadocs' exported advanced index this check reads: its document ids. */
interface AdvancedSearchIndex {
	readonly type: "advanced"
	readonly internalDocumentIDStore: { readonly internalIdToId: readonly string[] }
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value)
}

function isAdvancedSearchIndex(value: unknown): value is AdvancedSearchIndex {
	if (!isRecord(value) || value["type"] !== "advanced") return false
	const store = value["internalDocumentIDStore"]
	if (!isRecord(store)) return false
	const ids = store["internalIdToId"]
	return Array.isArray(ids) && ids.every((id) => typeof id === "string")
}

/** The search index's document ids, or `undefined` when the file is not an exported advanced index. */
function indexedDocumentIds(content: string): readonly string[] | undefined {
	let parsed: unknown
	try {
		parsed = JSON.parse(content)
	} catch {
		return undefined
	}
	return isAdvancedSearchIndex(parsed) ? parsed.internalDocumentIDStore.internalIdToId : undefined
}

/** Failures for a search index the build did not produce, or exported with no entries. */
export function checkSearchIndex(files: readonly BuiltFile[]): readonly BuildFailure[] {
	const file = fileAt(files, SEARCH_INDEX_FILE)
	if (file === undefined) {
		return [
			buildFailure(
				"SEARCH_INDEX_MISSING",
				SEARCH_INDEX_FILE,
				"the build did not produce the search index",
			),
		]
	}
	const ids = indexedDocumentIds(file.content)
	if (ids === undefined) {
		return [
			buildFailure(
				"SEARCH_INDEX_INVALID",
				SEARCH_INDEX_FILE,
				"the search index is not an advanced index export",
			),
		]
	}
	if (ids.length === 0) {
		return [
			buildFailure("SEARCH_INDEX_EMPTY", SEARCH_INDEX_FILE, "the search index holds no entries"),
		]
	}
	return []
}
