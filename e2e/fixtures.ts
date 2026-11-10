import { test as base, expect } from "@playwright/test"
import { NOT_FOUND_PATH } from "./built-site"

/** The specs' `test`: a page that fails its spec on a console error or a failed request. */
export const test = base.extend<{ pageProblems: undefined }>({
	pageProblems: [
		async ({ page }, use) => {
			const problems: string[] = []
			// The 404 page is a document the browser reports as missing on purpose, so it is allowed.
			const intendedNotFound = new Set<string>()
			page.on("response", (response) => {
				const isNotFoundPage =
					response.request().resourceType() === "document" &&
					response.status() === 404 &&
					new URL(response.url()).pathname === NOT_FOUND_PATH
				if (isNotFoundPage) {
					intendedNotFound.add(response.url())
					return
				}
				if (response.status() >= 400) {
					problems.push(`response: ${response.status()} ${response.url()}`)
				}
			})
			page.on("console", (message) => {
				if (message.type() !== "error") {
					return
				}
				const missingPage =
					message.text().startsWith("Failed to load resource") &&
					intendedNotFound.has(message.location().url)
				if (!missingPage) {
					problems.push(`console: ${message.text()}`)
				}
			})
			page.on("requestfailed", (request) => {
				const reason = request.failure()?.errorText ?? "unknown"
				// A request the browser cancelled (an abandoned prefetch) is not a failure a reader sees.
				if (reason === "net::ERR_ABORTED") {
					return
				}
				problems.push(`request failed: ${request.method()} ${request.url()} (${reason})`)
			})
			await use(undefined)
			expect(problems, "the page logged console errors or failed a request").toEqual([])
		},
		{ auto: true },
	],
})

export { expect }
