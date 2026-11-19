import { DOCS_INDEX_PATH } from "../tabs"
import type { BuiltFile } from "./built-files"
import { fileAt } from "./built-files"
import { DOCS_INDEX_FILE, type DocsIndexEntry, parseDocsIndex } from "./docs-index-file"
import type { BuildFailure } from "./failures"
import { buildFailure } from "./failures"
import { sitePath } from "./site-path"

/** A Markdown link of a twin: its target, which a twin read off the site must resolve absolutely. */
const MARKDOWN_LINK = /\[[^\]]*\]\(([^)\s]+)\)/g

/** The first line of a twin, which carries its title. */
function firstLine(content: string): string {
	return content.split("\n", 1)[0] ?? ""
}

/** Every built Markdown twin, at its assets-root-relative path. */
function twinFiles(files: readonly BuiltFile[]): readonly BuiltFile[] {
	return files.filter((file) => file.path.startsWith("docs/") && file.path.endsWith(".md"))
}

/** Whether a twin carries a Markdown link to the Docs index. */
function referencesIndex(content: string): boolean {
	return [...content.matchAll(MARKDOWN_LINK)].some(
		(match) => sitePath(match[1] ?? "") === DOCS_INDEX_PATH,
	)
}

/** The index entry that lists one twin, or `undefined` when the index does not list it. */
function entryFor(entries: readonly DocsIndexEntry[], path: string): DocsIndexEntry | undefined {
	return entries.find((entry) => entry.twin === path)
}

/** The title failure of a twin, or `undefined` when its first line is the title the index gives it. */
function titleFailure(
	file: BuiltFile,
	entry: DocsIndexEntry | undefined,
): BuildFailure | undefined {
	const title = firstLine(file.content)
	if (!/^# \S/.test(title)) {
		return buildFailure("TWIN_TITLE_MISSING", file.path, "the twin does not start with a title")
	}
	if (entry === undefined) return undefined
	const expected = `# ${entry.title}`
	return title === expected
		? undefined
		: buildFailure("TWIN_TITLE_MISMATCH", file.path, `the twin does not start with "${expected}"`)
}

/** The index-reference failure of a twin, or `undefined` when it links the Docs index. */
function referenceFailure(file: BuiltFile): BuildFailure | undefined {
	return referencesIndex(file.content)
		? undefined
		: buildFailure(
				"TWIN_INDEX_REFERENCE_MISSING",
				file.path,
				`the twin carries no Markdown link to ${DOCS_INDEX_PATH}`,
			)
}

/** Failures for a twin that does not start with the title the index gives it, or never names the index. */
export function checkMarkdownTwins(files: readonly BuiltFile[]): readonly BuildFailure[] {
	const indexFile = fileAt(files, DOCS_INDEX_FILE)
	const entries = indexFile === undefined ? [] : (parseDocsIndex(indexFile.content) ?? [])
	return twinFiles(files).flatMap((file) =>
		[titleFailure(file, entryFor(entries, `/${file.path}`)), referenceFailure(file)].filter(
			(failure): failure is BuildFailure => failure !== undefined,
		),
	)
}
