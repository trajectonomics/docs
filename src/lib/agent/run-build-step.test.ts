import { describe, expect, test } from "bun:test"
import { MarkdownTwinError } from "./markdown-twin"
import { PageWordsError } from "./page-words"
import { runBuildStep } from "./run-build-step"

/** The value `step` is refused with, or `undefined` when it passes. */
async function refusalOf(step: () => Promise<string> | string): Promise<unknown> {
	try {
		await runBuildStep(step)
		return undefined
	} catch (error) {
		return error
	}
}

describe("a build step's refusal", () => {
	test("a domain refusal becomes a build error with its message and its code kept as the cause", async () => {
		const refusal = new MarkdownTwinError("JSX_BODY", "tx has a JSX body", "body")
		const error = await refusalOf(() => {
			throw refusal
		})
		expect(error).toBeInstanceOf(Error)
		expect((error as Error).message).toBe("tx has a JSX body")
		expect((error as Error).cause).toBe(refusal)
		expect(Object.isExtensible(error)).toBe(true)
	})

	test("a page with no frontmatter title becomes a build error with its message", async () => {
		const error = await refusalOf(() => {
			throw new PageWordsError("TITLE_MISSING", "/docs/cli has no frontmatter title", "data.title")
		})
		expect((error as Error).message).toBe("/docs/cli has no frontmatter title")
	})

	test("a frozen error from anywhere becomes a build error with its message", async () => {
		const frozen = Object.freeze(new Error("the sync manifest is broken"))
		const error = await refusalOf(() => {
			throw frozen
		})
		expect((error as Error).message).toBe("the sync manifest is broken")
		expect((error as Error).cause).toBe(frozen)
	})

	test("any other error passes through unchanged", async () => {
		const original = new TypeError("boom")
		expect(
			await refusalOf(() => {
				throw original
			}),
		).toBe(original)
	})
})
