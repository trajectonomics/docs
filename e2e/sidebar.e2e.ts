import type { Page } from "@playwright/test"
import { openSidebarDrawer } from "./docs-portal"
import { expect, test } from "./fixtures"
import { DOCS_PAGE_PATH, openDocsPage } from "./shell"

/** Fumadocs' `lg` breakpoint, where the header carries the Tabs and the sidebar drops them. */
const LG_BREAKPOINT_PX = 1024

/** Twenty's sidebar rhythm: a 36px row standing 6px below the one above it, inset 12px. */
const ROW_HEIGHT_PX = 36
const ROW_PITCH_PX = 42
const INSET_PX = 12

/** The widths the sidebar is looked at: wide screen, desktop, and phone. */
const WIDE_WIDTH_PX = 2000
const PHONE_WIDTH_PX = 390

/** How many Tab links the header renders that the breakpoint leaves on screen. */
async function visibleHeaderTabs(page: Page): Promise<number> {
	return page.evaluate(
		() =>
			[...document.querySelectorAll("#nd-subnav [data-shell-tab]")].filter(
				(link) => link.getClientRects().length > 0,
			).length,
	)
}

/** How many sidebar Tab dropdowns are on screen, in the sidebar or in the phone drawer. */
async function visibleSidebarTabs(page: Page): Promise<number> {
	return page.evaluate(
		() =>
			[...document.querySelectorAll("[data-sidebar-tabs]")].filter(
				(element) => element.getClientRects().length > 0,
			).length,
	)
}

/**
 * Whether the block shows the way back to the site above the search, the order the reference puts
 * them in.
 */
async function siteComesFirst(block: ReturnType<Page["locator"]>): Promise<boolean> {
	return block.evaluate((element) => {
		const site = element.querySelector("[data-site-home]")
		const search = element.querySelector("[data-search-full]")
		if (site === null || search === null) return false
		const following = site.compareDocumentPosition(search) & Node.DOCUMENT_POSITION_FOLLOWING
		return following !== 0
	})
}

for (const widthPx of [1280, WIDE_WIDTH_PX, PHONE_WIDTH_PX]) {
	test(`the Tabs appear in exactly one place at ${widthPx}px`, async ({ page }) => {
		await openDocsPage(page, widthPx)
		const wide = widthPx >= LG_BREAKPOINT_PX
		if (!wide) {
			// Below lg the sidebar may be a drawer: open it so its dropdown is on screen to count.
			await openSidebarDrawer(page)
		}

		expect(
			await visibleHeaderTabs(page),
			wide ? "the header carries the Tabs" : "no header Tabs",
		).toBe(wide ? 2 : 0)
		expect(
			await visibleSidebarTabs(page),
			wide ? "no sidebar Tab dropdown from lg up" : "the sidebar carries the Tabs",
		).toBe(wide ? 0 : 1)
	})
}

test("the sidebar's tree keeps the reference's rhythm", async ({ page }) => {
	await openDocsPage(page, WIDE_WIDTH_PX)

	// The tree's rows carry `data-active`; the top block's controls do not.
	const rows = await page.evaluate(() =>
		[...document.querySelectorAll("#nd-sidebar a[data-active]")].slice(0, 3).map((row) => {
			const rect = row.getBoundingClientRect()
			return { top: rect.top, left: rect.left, height: rect.height }
		}),
	)

	expect(rows, "the sidebar renders its tree rows").toHaveLength(3)
	for (const row of rows) {
		expect(row.height, "a tree row is 36px tall").toBe(ROW_HEIGHT_PX)
		expect(row.left, "the tree is inset 12px from the page edge").toBe(INSET_PX)
	}
	const pitch = (rows[1]?.top ?? 0) - (rows[0]?.top ?? 0)
	expect(pitch, "the rows stand 6px apart").toBe(ROW_PITCH_PX)
})

test("the sidebar's top block carries the site button and the search", async ({ page }) => {
	await openDocsPage(page, 1280)
	const block = page.locator("#nd-sidebar [data-sidebar-top-block]")

	await expect(block.locator("[data-site-home]")).toBeVisible()
	await expect(block.locator("[data-search-full]")).toBeVisible()
	expect(await siteComesFirst(block), "the site button sits above the search").toBe(true)
})

test("the phone drawer opens with the site button, the search and the Tab dropdown", async ({
	page,
}) => {
	await openDocsPage(page, PHONE_WIDTH_PX)
	await openSidebarDrawer(page)

	const block = page.locator("#nd-sidebar-mobile [data-sidebar-top-block]")
	await expect(block).toBeVisible()
	await expect(block.locator("[data-site-home]")).toBeVisible()
	await expect(block.locator("[data-search-full]")).toBeVisible()
	await expect(block.locator("[data-sidebar-tabs]")).toBeVisible()
	expect(await siteComesFirst(block), "the drawer keeps the block's order").toBe(true)

	// The drawer's own close button is the library's, rendered through the block, not one the shell
	// drew: it closes the drawer (docs#91).
	await block.getByRole("button", { name: "Close Sidebar" }).click()
	await expect(page.locator('#nd-sidebar-mobile[data-state="open"]')).toHaveCount(0)

	// The same navigation at the same size as the desktop sidebar's, so a phone reads it the same.
	const treeSize = await page
		.locator("#nd-sidebar-mobile a[data-active]")
		.first()
		.evaluate((row) => getComputedStyle(row).fontSize)
	expect(treeSize, "the drawer's tree reads at the desktop sidebar's size").toBe("14px")
})

test(`the header of ${DOCS_PAGE_PATH} carries the wordmark and the Tabs and nothing else`, async ({
	page,
}) => {
	await openDocsPage(page, 1280)
	const header = page.locator("#nd-subnav")

	expect(await header.locator("[data-search], [data-search-full]").count()).toBe(0)
	expect(await header.locator("[data-site-home]").count()).toBe(0)
	await expect(header.locator("[data-shell-tabs] a")).toHaveCount(2)
})
