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

/** The Landing Page, whose line sits in the header link row rather than in a sidebar block. */
const LANDING_PATH = `${DOCS_BASE_PATH}/`

/** The line as the reader reads it: the words, then each link under the name it carries. */
const SENTENCE = `${AGENT_LINE_PREFIX} ${MARKDOWN_LINK_NAME} ${AGENT_LINE_SEPARATOR} the ${DOCS_INDEX_LINK_NAME}`

/** The line the page shows; a docs page renders one copy in the sidebar and one in the drawer. */
function agentLine(page: Page) {
	return page.locator("[data-agent-line]").filter({ visible: true })
}

/** The page's alternate Markdown link, the one an Agent reads instead of the affordance. */
function alternateLink(page: Page) {
	return page.locator('link[rel="alternate"][type="text/markdown"]')
}

/** The page's two links, each under the name the brief gives it. */
async function expectLinks(page: Page, path: string): Promise<void> {
	const line = agentLine(page)
	await expect(line, `${path} carries one visible line`).toHaveCount(1)
	await expect(line).toHaveText(SENTENCE)
	await expect(
		line.getByRole("link", { name: MARKDOWN_LINK_NAME, exact: true }),
		`${path} points at its Markdown twin`,
	).toHaveAttribute("href", twinPath(path))
	await expect(
		line.getByRole("link", { name: DOCS_INDEX_LINK_NAME, exact: true }),
		`${path} points at the Docs index`,
	).toHaveAttribute("href", DOCS_INDEX_PATH)
}

for (const widthPx of [1280, 2000]) {
	for (const path of builtPages()) {
		test(`the ${pageName(path)} page points at its Markdown twin at ${widthPx}px`, async ({
			page,
		}) => {
			await page.setViewportSize({ width: widthPx, height: TEST_VIEWPORT_HEIGHT_PX })
			await openPage(page, path)
			await waitForIsland(page)

			await expect(alternateLink(page)).toHaveAttribute("href", twinPath(path))
			await expectLinks(page, path)
		})
	}
}

test("the 404 page carries neither the line nor an alternate Markdown link", async ({ page }) => {
	await openPage(page, NOT_FOUND_PATH)
	await waitForIsland(page)

	await expect(page.locator("[data-agent-line]")).toHaveCount(0)
	await expect(alternateLink(page)).toHaveCount(0)
})

test("the docs line sits at the top of the sidebar block, above the Site Home button", async ({
	page,
}) => {
	await page.setViewportSize({ width: 1280, height: TEST_VIEWPORT_HEIGHT_PX })
	await openPage(page, tabUrl(TABS[0]))
	await waitForIsland(page)

	const block = page.locator("#nd-sidebar [data-sidebar-top-block]")
	await expect(block.locator("[data-agent-line]")).toBeVisible()
	const lineAboveSiteHome = await block.evaluate((element) => {
		const line = element.querySelector("[data-agent-line]")
		const siteHome = element.querySelector("[data-site-home]")
		if (line === null || siteHome === null) return false
		const following = line.compareDocumentPosition(siteHome) & Node.DOCUMENT_POSITION_FOLLOWING
		return following !== 0
	})
	expect(lineAboveSiteHome, "the line stands above the Site Home button").toBe(true)
	// The docs header keeps the mark and the Tabs: the line never moves into the header (ADR 0009).
	await expect(page.locator("#nd-subnav [data-agent-line]")).toHaveCount(0)
})

test("the docs line is behind the Open Sidebar control at 390px", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: TEST_VIEWPORT_HEIGHT_PX })
	await openPage(page, tabUrl(TABS[0]))
	await waitForIsland(page)
	await expect(agentLine(page)).toHaveCount(0)

	await openSidebarDrawer(page)

	await expectLinks(page, tabUrl(TABS[0]))
	await expect(page.locator("#nd-sidebar-mobile [data-agent-line]")).toBeVisible()
})

test("the line's two links load the twin and the index as their own documents", async ({
	page,
}) => {
	const from = tabUrl(TABS[0])
	await page.setViewportSize({ width: 1280, height: TEST_VIEWPORT_HEIGHT_PX })
	await openPage(page, from)
	await waitForIsland(page)
	const documents: string[] = []
	page.on("request", (request) => {
		if (request.resourceType() === "document") documents.push(new URL(request.url()).pathname)
	})
	const line = page.locator("#nd-sidebar [data-agent-line]")

	await line.getByRole("link", { name: MARKDOWN_LINK_NAME, exact: true }).click()
	await expect(page).toHaveURL(twinPath(from))
	await expect(page.locator("body")).toContainText("# Quickstart")
	expect(documents, "the twin loaded as its own document").toEqual([twinPath(from)])

	documents.length = 0
	await openPage(page, from)
	await waitForIsland(page)
	documents.length = 0
	await page
		.locator("#nd-sidebar [data-agent-line]")
		.getByRole("link", { name: DOCS_INDEX_LINK_NAME, exact: true })
		.click()
	await expect(page).toHaveURL(DOCS_INDEX_PATH)
	await expect(page.locator("body")).toContainText("# Trajectonomics Docs")
	expect(documents, "the index loaded as its own document").toEqual([DOCS_INDEX_PATH])
})

test("the Landing Page's line sits in its header link row, never in its body", async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: TEST_VIEWPORT_HEIGHT_PX })
	await openPage(page, LANDING_PATH)
	await waitForIsland(page)

	await expectLinks(page, LANDING_PATH)
	// The header's own link row carries it; the page body keeps its own parts (ADR 0009's amendment).
	const headerLine = page.locator("#nd-nav").locator("[data-agent-line]").filter({ visible: true })
	await expect(headerLine).toHaveCount(1)
	await expect(page.locator("#nd-home-layout > div [data-agent-line]")).toHaveCount(0)
})

test("the Landing Page's line is in the header menu at 390px", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: TEST_VIEWPORT_HEIGHT_PX })
	await openPage(page, LANDING_PATH)
	await waitForIsland(page)
	await expect(agentLine(page)).toHaveCount(0)

	await openPhoneMenu(page)

	await expectLinks(page, LANDING_PATH)
	const menuLine = page.locator("#nd-nav").locator("[data-agent-line]").filter({ visible: true })
	await expect(menuLine).toHaveCount(1)
})

test("the line's Markdown link names the page the reader lands on, not the one it rendered on", async ({
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
	const line = page.locator("#nd-sidebar [data-agent-line]")
	await expect(line.getByRole("link", { name: MARKDOWN_LINK_NAME })).toHaveAttribute(
		"href",
		twinPath(from),
	)

	await page.locator("#nd-sidebar").getByRole("link", { name: "Installation" }).click()

	await expect(page).toHaveURL(to)
	await expect(line.getByRole("link", { name: MARKDOWN_LINK_NAME })).toHaveAttribute(
		"href",
		twinPath(to),
	)
	expect(documentRequests, "the reader stayed in one document").toBe(1)
})
