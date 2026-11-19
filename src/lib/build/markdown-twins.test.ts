import { describe, expect, test } from "bun:test"
import { indexReference } from "../agent/index-reference"
import { SITE_ORIGIN } from "../site"
import type { BuiltFile } from "./built-files"
import { DOCS_INDEX_FILE } from "./docs-index-file"
import { checkMarkdownTwins } from "./markdown-twins"

const ENTRIES = [
	["Trajectonomics Docs", `${SITE_ORIGIN}/docs/index.md`],
	["Quickstart", `${SITE_ORIGIN}/docs/cli.md`],
	["tx", `${SITE_ORIGIN}/docs/cli/commands/tx.md`],
] as const

function docsIndex(entries: readonly (readonly [string, string])[] = ENTRIES): BuiltFile {
	const bullets = entries.map(([title, url]) => `- [${title}](${url})`)
	return {
		path: DOCS_INDEX_FILE,
		content: ["# Trajectonomics Docs", "", ...bullets, ""].join("\n"),
	}
}

function twin(path: string, title: string, reference = indexReference(SITE_ORIGIN)): BuiltFile {
	return {
		path,
		content: [`# ${title}`, "", "The body.", "", reference, ""].join("\n"),
	}
}

/** A build whose every twin starts with the index's title and names the index. */
const COMPLETE_BUILD: readonly BuiltFile[] = [
	docsIndex(),
	twin("docs/index.md", "Trajectonomics Docs"),
	twin("docs/cli.md", "Quickstart"),
	twin("docs/cli/commands/tx.md", "tx"),
]

describe("a Markdown twin's shape", () => {
	test("a twin that starts with the index's title and names the index reports no failure", () => {
		expect(checkMarkdownTwins(COMPLETE_BUILD)).toEqual([])
	})

	test("a twin whose first line is not its title is reported as TWIN_TITLE_MISSING", () => {
		const files = COMPLETE_BUILD.map((file) =>
			file.path === "docs/cli.md"
				? { ...file, content: `> Quickstart\n\n${indexReference(SITE_ORIGIN)}\n` }
				: file,
		)

		expect(checkMarkdownTwins(files).map((failure) => failure.code)).toEqual(["TWIN_TITLE_MISSING"])
	})

	test("a twin whose title differs from the index's is reported as TWIN_TITLE_MISMATCH", () => {
		const files = COMPLETE_BUILD.map((file) =>
			file.path === "docs/cli.md" ? twin("docs/cli.md", "Start here") : file,
		)

		expect(checkMarkdownTwins(files).map((failure) => failure.code)).toEqual([
			"TWIN_TITLE_MISMATCH",
		])
	})

	test("a twin with no Markdown link to the Docs index is reported as TWIN_INDEX_REFERENCE_MISSING", () => {
		const files = COMPLETE_BUILD.map((file) =>
			file.path === "docs/cli.md" ? twin("docs/cli.md", "Quickstart", "") : file,
		)

		const failures = checkMarkdownTwins(files)
		expect(failures.map((failure) => failure.code)).toEqual(["TWIN_INDEX_REFERENCE_MISSING"])
		expect(failures[0]?.path).toBe("docs/cli.md")
	})

	test("a relative link to the index counts, because the twin and the index share the Portal's origin", () => {
		const files = COMPLETE_BUILD.map((file) =>
			file.path === "docs/cli.md"
				? twin("docs/cli.md", "Quickstart", "Part of the [Docs index](/docs/llms.txt).")
				: file,
		)

		expect(checkMarkdownTwins(files)).toEqual([])
	})

	test("with no index the missing-index check owns the failure, and twins still need their title and link", () => {
		const files = COMPLETE_BUILD.filter((file) => file.path !== DOCS_INDEX_FILE)

		expect(checkMarkdownTwins(files)).toEqual([])
	})
})
