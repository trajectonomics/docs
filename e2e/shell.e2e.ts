import type { Page } from "@playwright/test"
import { DOCS_BASE_PATH } from "../src/lib/tabs"
import { openPage } from "./built-site"
import { openSidebarDrawer, waitForSettledPage } from "./docs-portal"
import { expect, test } from "./fixtures"
import { TEST_VIEWPORT_HEIGHT_PX, TEST_WIDTHS_PX } from "./viewports"

/** The one header row's height: `--spacing(14)`, which Fumadocs sets for the sidebar Tab mode. */
const HEADER_HEIGHT_PX = 56

/** The reading column's measure, the design brief's 900px page column (ADR 0009). */
const READING_MEASURE_PX = 900

/** Fumadocs' `lg` breakpoint, where the header carries the Tabs and the sidebar drops them. */
const LG_BREAKPOINT_PX = 1024

/** The header's own inset (`md:px-6`), which the wordmark opens the row from. */
const HEADER_INSET_PX = 24

/** Twenty's sidebar rhythm: a 36px row standing 6px below the one above it, inset 12px. */
const SIDEBAR_ROW_HEIGHT_PX = 36
const SIDEBAR_ROW_PITCH_PX = 42
const SIDEBAR_INSET_PX = 12

/** A docs page with headings, so the table of contents is in the shell as well. */
const DOCS_PAGE = `${DOCS_BASE_PATH}/cli/`

/** The widths the shell is looked at: desktop, wide screen, and phone. */
const WIDE_WIDTH_PX = 2000
const DESKTOP_WIDTH_PX = 1280
const PHONE_WIDTH_PX = 390

interface Box {
	readonly x: number
	readonly width: number
	readonly height: number
}

/** The rendered box of the first element the selector matches, or `null` when it matches none. */
async function box(page: Page, selector: string): Promise<Box | null> {
	return page.evaluate((query) => {
		const element = document.querySelector(query)
		if (element === null) return null
		const rect = element.getBoundingClientRect()
		return { x: rect.x, width: rect.width, height: rect.height }
	}, selector)
}

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
 * Whether the block shows the way back to the site before the search above it, the order the
 * reference puts them in.
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

/** Open the docs page at `widthPx` and let the shell settle. */
async function openDocsPage(page: Page, widthPx: number): Promise<void> {
	await page.setViewportSize({ width: widthPx, height: TEST_VIEWPORT_HEIGHT_PX })
	await openPage(page, DOCS_PAGE)
	await waitForSettledPage(page)
}

test("the shell spans the page and the header is one row", async ({ page }) => {
	await openDocsPage(page, WIDE_WIDTH_PX)
	const viewport = await page.evaluate(() => ({ width: window.innerWidth }))

	const header = await box(page, "#nd-subnav")
	const tabs = await box(page, "[data-shell-tabs]")
	const wordmark = await box(page, "#nd-subnav [data-header-body] a")
	const sidebar = await box(page, "#nd-sidebar")
	const contents = await box(page, "#nd-toc")
	const reading = await box(page, "#nd-page > *")

	expect(header, "the header is rendered").not.toBeNull()
	expect(header?.x, "the header starts at the page's left edge").toBe(0)
	expect(header?.width, "the header spans the page").toBe(viewport.width)
	expect(header?.height, "the header is one 56px row").toBe(HEADER_HEIGHT_PX)
	expect(
		await page.locator("#nd-subnav [data-header-tabs]").count(),
		"the header draws no second Tab row",
	).toBe(0)

	expect(sidebar?.x, "the sidebar starts at the page's left edge").toBe(0)
	expect(contents, "the table of contents is rendered").not.toBeNull()
	expect(
		(contents?.x ?? 0) + (contents?.width ?? 0),
		"the table of contents ends at the page's right edge",
	).toBe(viewport.width)

	// The Tabs are centred on the page itself, not on the space the wordmark leaves.
	expect(tabs, "the Tabs are in the header").not.toBeNull()
	const tabsCentre = (tabs?.x ?? 0) + (tabs?.width ?? 0) / 2
	expect(Math.abs(tabsCentre - viewport.width / 2)).toBeLessThanOrEqual(1)
	// The wordmark keeps the header's own inset, so the row starts where the page does.
	expect(wordmark?.x, "the wordmark sits at the header's inset").toBe(HEADER_INSET_PX)

	// The reading column keeps its measure, centred between the sidebar and the contents.
	const sidebarRight = (sidebar?.x ?? 0) + (sidebar?.width ?? 0)
	const contentsLeft = contents?.x ?? 0
	expect(reading, "the reading column is rendered").not.toBeNull()
	expect(reading?.width, "the reading column takes the measure").toBe(READING_MEASURE_PX)
	expect(reading?.x, "the reading column is centred in the page track").toBeCloseTo(
		sidebarRight + (contentsLeft - sidebarRight - READING_MEASURE_PX) / 2,
		0,
	)
})

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
		expect(row.height, "a tree row is 36px tall").toBe(SIDEBAR_ROW_HEIGHT_PX)
		expect(row.left, "the tree is inset 12px from the page edge").toBe(SIDEBAR_INSET_PX)
	}
	const [first, second] = rows
	const pitch = (second?.top ?? 0) - (first?.top ?? 0)
	expect(pitch, "the rows stand 6px apart").toBe(SIDEBAR_ROW_PITCH_PX)
})

test("the header carries the wordmark and the Tabs and nothing else", async ({ page }) => {
	await openDocsPage(page, DESKTOP_WIDTH_PX)

	expect(
		await page.locator("#nd-subnav [data-search], #nd-subnav [data-search-full]").count(),
	).toBe(0)
	expect(
		await page.locator("#nd-subnav a[data-site-home], #nd-subnav [data-site-home]").count(),
	).toBe(0)
	expect(
		await page
			.locator("#nd-subnav button[aria-label*='heme'], #nd-subnav [data-theme-switch]")
			.count(),
		"the header offers no theme switch",
	).toBe(0)

	// The search and the way back to the site live at the top of the sidebar instead.
	await expect(page.locator("#nd-sidebar [data-site-home]")).toBeVisible()
	await expect(page.locator("#nd-sidebar [data-search-full]")).toBeVisible()

	expect(
		await siteComesFirst(page.locator("#nd-sidebar [data-sidebar-top-block]")),
		"the site button sits above the search",
	).toBe(true)
})

for (const widthPx of TEST_WIDTHS_PX) {
	test(`the Tabs appear in exactly one place at ${widthPx}px`, async ({ page }) => {
		await openDocsPage(page, widthPx)
		const wide = widthPx >= LG_BREAKPOINT_PX
		if (widthPx < LG_BREAKPOINT_PX) {
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
	await expect(block.getByRole("button", { name: /Tab|Quickstart|Build/ }).first()).toBeVisible()

	expect(await siteComesFirst(block), "the drawer keeps the block's order").toBe(true)

	// The same navigation at the same size as the desktop sidebar's, so a phone reads it the same.
	const treeSize = await page
		.locator("#nd-sidebar-mobile a[data-active]")
		.first()
		.evaluate((row) => getComputedStyle(row).fontSize)
	expect(treeSize, "the drawer's tree reads at the desktop sidebar's size").toBe("14px")
})

test("the portal renders one Theme for every reader", async ({ page }) => {
	await page.emulateMedia({ colorScheme: "dark" })
	await openDocsPage(page, DESKTOP_WIDTH_PX)
	const dark = await page.evaluate(() => ({
		theme: document.documentElement.dataset["theme"],
		scheme: getComputedStyle(document.documentElement).colorScheme,
	}))

	await page.emulateMedia({ colorScheme: "light" })
	await openDocsPage(page, DESKTOP_WIDTH_PX)
	const light = await page.evaluate(() => document.documentElement.dataset["theme"])

	// The seam declares the one Theme every reader gets, and the device's scheme never changes it.
	expect(dark.theme, "a dark device gets the portal's own Theme").toBe(dark.scheme)
	expect(light, "a light device gets the same Theme").toBe(dark.theme)
	expect(
		await page.locator("[data-theme-switch], button[aria-label*='heme']").count(),
		"no control offers the other Theme",
	).toBe(0)
})
