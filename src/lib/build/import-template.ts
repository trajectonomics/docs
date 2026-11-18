import type { BuiltFile } from "./built-files"
import { fileAt } from "./built-files"
import type { BuildFailure } from "./failures"
import { buildFailure } from "./failures"

/** The one CSV template header `traj tx import --template` prints, copied from cli ADR 0025. */
export const IMPORT_TEMPLATE_HEADER = "date,from,to,amount,memo,external_ref,project"

/** Assets-root path of the built `tx` command page. */
const TX_PAGE_FILE = "docs/cli/commands/tx/index.html"

const PRE = /<pre\b[^>]*>([\s\S]*?)<\/pre>/gi
const TAG = /<[^>]*>/g
const WHITESPACE = /\s+/

/** The text of every code block on the page, with the highlighter's tags stripped. */
function codeTexts(content: string): readonly string[] {
	return [...content.matchAll(PRE)].map((match) => (match[1] ?? "").replace(TAG, ""))
}

/** Whether one code block carries the header as a line of its own. */
function showsHeader(content: string): boolean {
	return codeTexts(content).some((text) => text.split(WHITESPACE).includes(IMPORT_TEMPLATE_HEADER))
}

/** Failures for a `tx` page that is missing, or that does not show the import template as code. */
export function checkImportTemplate(files: readonly BuiltFile[]): readonly BuildFailure[] {
	const page = fileAt(files, TX_PAGE_FILE)
	if (page === undefined) {
		return [
			buildFailure(
				"IMPORT_TEMPLATE_NOT_SHOWN",
				TX_PAGE_FILE,
				"the build did not produce the tx command page",
			),
		]
	}
	if (showsHeader(page.content)) return []
	return [
		buildFailure(
			"IMPORT_TEMPLATE_NOT_SHOWN",
			TX_PAGE_FILE,
			`the page does not show "${IMPORT_TEMPLATE_HEADER}" inside a code block`,
		),
	]
}
