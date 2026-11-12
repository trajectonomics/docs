import { describe, expect, test } from "bun:test"
import { DEFAULT_TAB, isTabPath, TABS, tabUrl } from "./tabs"
import { renderWorkerRedirects } from "./worker-redirects"

describe("Docs Portal Tabs", () => {
	test("there is one Operator tab and one Builder tab, in that order", () => {
		expect(TABS.map((tab) => tab.audience)).toEqual(["Operator", "Builder"])
	})

	test("the Operator tab lives at /docs/cli/ and the Builder tab at /docs/developers/", () => {
		expect(TABS.map(tabUrl)).toEqual(["/docs/cli/", "/docs/developers/"])
	})

	test("/docs lands on the Operator tab", () => {
		expect(DEFAULT_TAB.audience).toBe("Operator")
		expect(renderWorkerRedirects()).toBe("/docs /docs/cli/ 302\n/docs/ /docs/cli/ 302\n")
	})

	test("each Tab folder is a Fumadocs root folder titled as the Tab", async () => {
		for (const tab of TABS) {
			const meta = await Bun.file(`src/content/docs/${tab.folder}/meta.json`).json()
			expect(meta).toMatchObject({ title: tab.title, root: true })
		}
	})
})

describe("the Tab a pathname belongs to", () => {
	test("a Tab's landing page belongs to that Tab", () => {
		expect(isTabPath(TABS[0], "/docs/cli/")).toBe(true)
		expect(isTabPath(TABS[1], "/docs/developers/")).toBe(true)
	})

	test("a page under a Tab belongs to that Tab", () => {
		expect(isTabPath(TABS[0], "/docs/cli/installation/")).toBe(true)
		expect(isTabPath(TABS[1], "/docs/developers/sim-core/")).toBe(true)
	})

	test("another Tab's pages do not belong to this Tab", () => {
		expect(isTabPath(TABS[0], "/docs/developers/")).toBe(false)
		expect(isTabPath(TABS[0], "/docs/developers/sim-core/")).toBe(false)
	})

	test("the Landing Page belongs to no Tab", () => {
		expect(isTabPath(TABS[0], "/docs/")).toBe(false)
		expect(isTabPath(TABS[1], "/docs/")).toBe(false)
	})

	test("a path that only starts with a Tab's name is another page", () => {
		expect(isTabPath(TABS[0], "/docs/cli-reference/")).toBe(false)
	})
})
