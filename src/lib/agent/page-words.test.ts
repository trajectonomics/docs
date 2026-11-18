import { describe, expect, test } from "bun:test"
import { pageWords } from "./page-words"

describe("a page's authored words", () => {
	test("are its frontmatter title and description, with the URL its twin follows", () => {
		expect(
			pageWords({ url: "/docs/cli", data: { title: "Quickstart", description: "Install traj." } }),
		).toEqual({ title: "Quickstart", description: "Install traj.", url: "/docs/cli" })
	})

	test("are refused when the page has no title, because it has no faithful twin or index entry", () => {
		expect(() => pageWords({ url: "/docs/cli", data: {} })).toThrow(
			"/docs/cli has no frontmatter title",
		)
	})
})
