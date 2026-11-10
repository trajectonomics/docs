import { SEARCH_INDEX_PATH } from "../tabs"
import type { BuiltFile } from "./built-files"
import { fileAt } from "./built-files"
import type { BuildFailure } from "./failures"
import { buildFailure } from "./failures"

/** Path of the static search index in the build output, one segment below the assets root. */
export const SEARCH_INDEX_FILE = SEARCH_INDEX_PATH.slice(1)

/** The part of Fumadocs' exported advanced index that names the pages it answers with. */
interface AdvancedSearchDocuments {
	readonly docs?: Record<string, unknown>
}

/** The part of Fumadocs' exported advanced index this check reads. */
export interface AdvancedSearchIndex {
	readonly type: "advanced"
	readonly internalDocumentIDStore: { readonly internalIdToId: readonly string[] }
	readonly docs?: AdvancedSearchDocuments
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

/** The parsed advanced index, or `undefined` when the content is not an exported advanced index. */
export function parseSearchIndex(content: string): AdvancedSearchIndex | undefined {
	let parsed: unknown
	try {
		parsed = JSON.parse(content)
	} catch {
		return undefined
	}
	return isAdvancedSearchIndex(parsed) ? parsed : undefined
}

/** The page ids the index answers with; empty when it exported no page entries. */
export function indexedPageIds(index: AdvancedSearchIndex): ReadonlySet<string> {
	const pageIds = new Set<string>()
	const entries = index.docs?.docs
	if (entries === undefined) {
		return pageIds
	}
	for (const entry of Object.values(entries)) {
		if (isRecord(entry) && entry["type"] === "page" && typeof entry["page_id"] === "string") {
			pageIds.add(entry["page_id"])
		}
	}
	return pageIds
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
	const index = parseSearchIndex(file.content)
	if (index === undefined) {
		return [
			buildFailure(
				"SEARCH_INDEX_INVALID",
				SEARCH_INDEX_FILE,
				"the search index is not an advanced index export",
			),
		]
	}
	if (index.internalDocumentIDStore.internalIdToId.length === 0) {
		return [
			buildFailure("SEARCH_INDEX_EMPTY", SEARCH_INDEX_FILE, "the search index holds no entries"),
		]
	}
	return []
}
