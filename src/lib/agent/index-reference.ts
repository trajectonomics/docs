import { DOCS_INDEX_PATH } from "../tabs"

/** The line a Markdown twin ends with: its reference to the Docs index it belongs to. */
export function indexReference(origin: string): string {
	return `Part of the [Docs index](${origin}${DOCS_INDEX_PATH}).`
}
