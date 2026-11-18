import { describe, expect, test } from "bun:test"
import { shownDescription } from "./description"

describe("the description a twin or an index bullet shows", () => {
	test("a page's description is shown as it was written", () => {
		expect(shownDescription("Manage ledger transactions.")).toBe("Manage ledger transactions.")
	})

	test("a page with no description shows none", () => {
		expect(shownDescription(undefined)).toBeUndefined()
		expect(shownDescription("")).toBeUndefined()
	})
})
