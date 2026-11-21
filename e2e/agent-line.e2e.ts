import type { Page } from "@playwright/test"
import { twinPath } from "../src/lib/agent/twin-path"
import {
	AGENT_LINE_PREFIX,
	AGENT_LINE_SEPARATOR,
	DOCS_INDEX_LINK_NAME,
	MARKDOWN_LINK_NAME,
} from "../src/lib/agent-line"
import { DOCS_BASE_PATH, DOCS_INDEX_PATH, TABS, tabUrl } from "../src/lib/tabs"
import { builtPages, NOT_FOUND_PATH, openPage, pageName } from "./built-site"
import { openPhoneMenu, openSidebarDrawer, waitForIsland } from "./docs-portal"
import { expect, test } from "./fixtures"
import { TEST_VIEWPORT_HEIGHT_PX } from "./viewports"

/** The Landing Page, whose pointer sits at the top of its body like every other page's. */
const LANDING_PATH = `${DOCS_BASE_PATH}/`

/** The line as an Agent reads it: the words, then each link under the name it carries. */
const SENTENCE = `${AGENT_LINE_PREFIX} ${MARKDOWN_LINK_NAME} ${AGENT_LINE_SEPARATOR} the ${DOCS_INDEX_LINK_NAME}`

/** The pointer a page carries for an Agent. It is in the document; no reader meets it. */
function agentLine(page: Page) {
	return page.locator("[data-agent-line]")
}

/** The page's alternate Markdown link, the other path an Agent reads. */
function alternateLink(page: Page) {
	return page.locator('link[rel="alternate"][type="text/markdown"]')
}

/** One of the pointer's links. Hidden from the accessibility tree, so it is asked for by name. */
function lineLink(page: Page, name: string) {
	return agentLine(page).getByRole("link", { name, exact: true, includeHidden: true })
}

/** Where the pointer sits in the shell: the places a reader looks, which it must stay out of. */
const SHELL_PLACES = [
	"#nd-nav",
	"#nd-subnav",
	"#nd-sidebar",
	"#nd-sidebar-mobile",
	"#nd-home-layout",
	"nav",
	"main",
]

/** Assert the pointer names this page's twin and the Docs index, in the words an Agent reads. */
async function expectPointer(page: Page, path: string): Promise<void> {
	await expect(agentLine(page), `${path} carries one pointer`).toHaveCount(1)
	await expect(agentLine(page)).toHaveText(SENTENCE)
	await expect(
		lineLink(page, MARKDOWN_LINK_NAME),
		`${path} points at its Markdown twin`,
	).toHaveAttribute("href", twinPath(path))
	await expect(
		lineLink(page, DOCS_INDEX_LINK_NAME),
		`${path} points at the Docs index`,
	).toHaveAttribute("href", DOCS_INDEX_PATH)
}

/** Assert a reader has no way to meet the pointer: no pixel to read, no stop, no announcement. */
async function expectNoReaderChannel(page: Page, path: string): Promise<void> {
	const line = agentLine(page)
	const box = await line.boundingBox()
	expect(box, `${path} lays the pointer out`).not.toBeNull()
	expect(box?.width, `${path} clips the pointer to a pixel across`).toBeLessThanOrEqual(1)
	expect(box?.height, `${path} clips the pointer to a pixel down`).toBeLessThanOrEqual(1)
	await expect(line, `${path} keeps the pointer from a screen reader`).toHaveAttribute(
		"aria-hidden",
		"true",
	)
	for (const name of [MARKDOWN_LINK_NAME, DOCS_INDEX_LINK_NAME]) {
		await expect(
			lineLink(page, name),
			`${path} keeps the ${name} link out of the tab order`,
		).toHaveAttribute("tabindex", "-1")
	}
}

/** Assert the pointer is the first thing in the body, ahead of the whole shell and outside every place a reader looks. */
async function expectPointerAtTopOfBody(page: Page, path: string): Promise<void> {
	const first = await page.evaluate(() =>
		document.body.firstElementChild?.hasAttribute("data-agent-line"),
	)
	expect(first, `${path} opens its body with the pointer`).toBe(true)
	const places = page.locator(SHELL_PLACES.map((place) => `${place} [data-agent-line]`).join(", "))
	await expect(places, `${path} keeps the pointer out of the shell`).toHaveCount(0)
}

for (const path of builtPages()) {
	test(`the ${pageName(path)} page points an Agent at its Markdown twin, and no reader at all`, async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1280, height: TEST_VIEWPORT_HEIGHT_PX })
		await openPage(page, path)
		await waitForIsland(page)

		await expect(alternateLink(page)).toHaveAttribute("href", twinPath(path))
		await expectPointer(page, path)
		await expectNoReaderChannel(page, path)
		await expectPointerAtTopOfBody(page, path)
	})
}

test("the 404 page carries neither the pointer nor an alternate Markdown link", async ({
	page,
}) => {
	await openPage(page, NOT_FOUND_PATH)
	await waitForIsland(page)

	await expect(agentLine(page)).toHaveCount(0)
	await expect(alternateLink(page)).toHaveCount(0)
})

test("a docs page's sidebar, header and drawer show no trace of the pointer at 390px", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: TEST_VIEWPORT_HEIGHT_PX })
	await openPage(page, tabUrl(TABS[0]))
	await waitForIsland(page)
	await expectPointer(page, tabUrl(TABS[0]))
	await expectNoReaderChannel(page, tabUrl(TABS[0]))

	await openSidebarDrawer(page)

	await expect(page.locator("#nd-sidebar-mobile")).not.toContainText(AGENT_LINE_PREFIX)
	await expectPointerAtTopOfBody(page, tabUrl(TABS[0]))
})

test("the Landing Page's header and menu show no trace of the pointer at 390px", async ({
	page,
}) => {
	await page.setViewportSize({ width: 390, height: TEST_VIEWPORT_HEIGHT_PX })
	await openPage(page, LANDING_PATH)
	await waitForIsland(page)
	await expectPointer(page, LANDING_PATH)
	await expectNoReaderChannel(page, LANDING_PATH)

	await openPhoneMenu(page)

	await expect(page.locator("#nd-nav")).not.toContainText(AGENT_LINE_PREFIX)
	await expectPointerAtTopOfBody(page, LANDING_PATH)
})

test("the pointer's two links load the twin and the index as their own documents", async ({
	page,
}) => {
	await openPage(page, tabUrl(TABS[0]))
	await waitForIsland(page)

	for (const name of [MARKDOWN_LINK_NAME, DOCS_INDEX_LINK_NAME]) {
		const link = lineLink(page, name)
		await expect(link, `${name} reloads the document`).toHaveAttribute("data-astro-reload", "true")
		await expect(link, `${name} is never prefetched`).toHaveAttribute(
			"data-astro-prefetch",
			"false",
		)
	}
})

test("the pointer's Markdown link names the page the reader lands on, not the one it rendered on", async ({
	page,
}) => {
	const from = tabUrl(TABS[0])
	const to = `${from}installation/`
	await page.setViewportSize({ width: 1280, height: TEST_VIEWPORT_HEIGHT_PX })
	let documentRequests = 0
	page.on("request", (request) => {
		if (request.resourceType() === "document") documentRequests++
	})
	await openPage(page, from)
	await waitForIsland(page)
	await expect(lineLink(page, MARKDOWN_LINK_NAME)).toHaveAttribute("href", twinPath(from))

	await page.locator("#nd-sidebar").getByRole("link", { name: "Installation" }).click()

	await expect(page).toHaveURL(to)
	await expect(lineLink(page, MARKDOWN_LINK_NAME)).toHaveAttribute("href", twinPath(to))
	await expectPointer(page, to)
	expect(documentRequests, "the reader stayed in one document").toBe(1)
})
