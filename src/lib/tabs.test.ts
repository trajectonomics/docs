import { describe, expect, test } from "bun:test"
import { DEFAULT_TAB, TABS, tabUrl } from "./tabs"
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
