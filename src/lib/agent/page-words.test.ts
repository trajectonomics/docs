import { describe, expect, test } from "bun:test"
import { PageWordsError, pageWords, type SourcePageWords } from "./page-words"

/** The refusal `pageWords` answers a page with, or `undefined` when it states the page's words. */
function refusalOf(page: SourcePageWords): { code: string; field: string } | undefined {
	try {
		pageWords(page)
		return undefined
	} catch (error) {
		return error instanceof PageWordsError
			? { code: error.code, field: error.field }
			: { code: "not-a-page-words-error", field: "" }
	}
}

describe("a page's authored words", () => {
	test("are its frontmatter title and description, with the URL its twin follows", () => {
		expect(
			pageWords({ url: "/docs/cli", data: { title: "Quickstart", description: "Install traj." } }),
		).toEqual({ title: "Quickstart", description: "Install traj.", url: "/docs/cli" })
	})

	test("are frozen, so no caller can edit the words a twin and its index bullet carry", () => {
		expect(Object.isFrozen(pageWords({ url: "/docs/cli", data: { title: "Quickstart" } }))).toBe(
			true,
		)
	})

	test("are refused as TITLE_MISSING when the frontmatter has no title", () => {
		expect(refusalOf({ url: "/docs/cli", data: {} })).toEqual({
			code: "TITLE_MISSING",
			field: "data.title",
		})
	})
})
