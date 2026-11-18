import { describe, expect, test } from "bun:test"
import { TABS } from "../tabs"
import { buildDocsIndex, type DocsIndexTab } from "./docs-index"

const ORIGIN = "https://trajectonomics.com"

/** The pages the two Tabs present, in their sidebar order. */
const TABS_PAGES: readonly DocsIndexTab[] = [
	{
		tab: TABS[0],
		pages: [
			{
				title: "Quickstart",
				description: "Install traj, then record your first transaction.",
				url: "/docs/cli",
			},
			{
				title: "tx",
				description: "Manage ledger transactions.",
				url: "/docs/cli/commands/tx",
			},
		],
	},
	{
		tab: TABS[1],
		pages: [
			{
				title: "Overview",
				description: "The packages and how they fit together.",
				url: "/docs/developers",
			},
		],
	},
]

/** The bullets of an index, in the order it lists them. */
function bullets(index: string): readonly string[] {
	return index.split("\n").filter((line) => line.startsWith("- "))
}

describe("the Docs index", () => {
	test("opens with the Portal's name, a blockquote of more than one line and how to fetch a page as Markdown", () => {
		const lines = buildDocsIndex(TABS_PAGES, ORIGIN).split("\n")
		expect(lines[0]).toBe("# Trajectonomics Docs")
		expect(lines[2]?.startsWith("> ")).toBe(true)
		expect(lines[3]?.startsWith("> ")).toBe(true)
		expect(lines[5]).toContain("`.md`")
	})

	test("has one section per Tab, in the Tabs' order, after a Start here section", () => {
		expect(
			buildDocsIndex(TABS_PAGES, ORIGIN)
				.split("\n")
				.filter((line) => line.startsWith("#")),
		).toEqual(["# Trajectonomics Docs", "## Start here", "## Operator", "## Builder"])
	})

	test("lists every page once, by title, at its absolute twin URL, with its description", () => {
		expect(bullets(buildDocsIndex(TABS_PAGES, ORIGIN))).toEqual([
			"- [Trajectonomics Docs](https://trajectonomics.com/docs/index.md): Documentation for running the Trajectonomics CLI and building on its packages.",
			"- [Quickstart](https://trajectonomics.com/docs/cli.md): Install traj, then record your first transaction.",
			"- [tx](https://trajectonomics.com/docs/cli/commands/tx.md): Manage ledger transactions.",
			"- [Overview](https://trajectonomics.com/docs/developers.md): The packages and how they fit together.",
		])
	})
})
