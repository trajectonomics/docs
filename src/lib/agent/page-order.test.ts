import { describe, expect, test } from "bun:test"
import type { Root } from "fumadocs-core/page-tree"
import { sidebarPageUrls } from "./page-order"

/** A Docs sidebar with the Tab's own page first, a nested folder with an index, a separator and an external link. */
const TREE: Root = {
	type: "root",
	name: "Docs",
	children: [
		{
			type: "folder",
			name: "CLI & Quickstart",
			children: [
				{ type: "page", name: "Quickstart", url: "/docs/cli" },
				{ type: "page", name: "Installation", url: "/docs/cli/installation" },
				{
					type: "folder",
					name: "Commands",
					index: { type: "page", name: "Commands", url: "/docs/cli/commands" },
					children: [{ type: "page", name: "tx", url: "/docs/cli/commands/tx" }],
				},
			],
		},
		{ type: "separator", name: "Elsewhere" },
		{ type: "page", name: "Source", url: "https://github.com/trajectonomics/docs", external: true },
		{
			type: "folder",
			name: "Build on Trajectonomics",
			children: [{ type: "page", name: "Overview", url: "/docs/developers" }],
		},
	],
}

describe("the order the Docs sidebar presents its pages in", () => {
	test("a page comes in its folder's place, and a nested folder's index page precedes its children", () => {
		expect(sidebarPageUrls(TREE)).toEqual([
			"/docs/cli",
			"/docs/cli/installation",
			"/docs/cli/commands",
			"/docs/cli/commands/tx",
			"/docs/developers",
		])
	})

	test("a separator and an external link are not Docs pages", () => {
		expect(sidebarPageUrls(TREE)).not.toContain("https://github.com/trajectonomics/docs")
	})

	test("the order is frozen, so no caller can reorder the Tabs it came from", () => {
		expect(Object.isFrozen(sidebarPageUrls(TREE))).toBe(true)
	})
})
