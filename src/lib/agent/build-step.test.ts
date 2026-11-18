import { describe, expect, test } from "bun:test"
import { buildStep } from "./build-step"
import { MarkdownTwinError } from "./markdown-twin"
import { PageWordsError } from "./page-words"

/** The value `step` is refused with, or `undefined` when it passes. */
async function refusalOf(step: () => Promise<string> | string): Promise<unknown> {
	try {
		await buildStep(step)
		return undefined
	} catch (error) {
		return error
	}
}

describe("a build step's refusal", () => {
	test("a domain refusal becomes a build error with its message, extensible for Astro to annotate", async () => {
		const error = await refusalOf(() => {
			throw new MarkdownTwinError("JSX_BODY", "tx has a JSX body", "body")
		})
		expect(error).toBeInstanceOf(Error)
		expect((error as Error).message).toBe("tx has a JSX body")
		expect(Object.isExtensible(error)).toBe(true)
	})

	test("a page with no frontmatter title becomes a build error with its message", async () => {
		const error = await refusalOf(() => {
			throw new PageWordsError("TITLE_MISSING", "/docs/cli has no frontmatter title", "data.title")
		})
		expect((error as Error).message).toBe("/docs/cli has no frontmatter title")
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
