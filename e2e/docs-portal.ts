import type { Page } from "@playwright/test"
import { TABS, type TabDefinition } from "../src/lib/tabs"

/**
 * Wait until the page's island (Docs, Landing, or NotFound) has hydrated, so its controls
 * respond to clicks.
 */
export async function waitForIsland(page: Page): Promise<void> {
	// Astro drops the `ssr` attribute when the island finishes hydrating.
	await page
		.locator(
			"astro-island[component-export='Docs']:not([ssr]), astro-island[component-export='Landing']:not([ssr]), astro-island[component-export='NotFound']:not([ssr])",
		)
		.waitFor()
}

/** The Tab a given Tab is not: the switcher's only other choice. */
export function otherTab(tab: TabDefinition): TabDefinition {
	const other = TABS.find((candidate) => candidate !== tab)
	if (other === undefined) {
		throw new Error("the Docs Portal needs a second Tab to switch to")
	}
	return other
}

/** A word from the Tab's title, so renaming the Tab renames the search term with it. */
export function searchTerm(tab: TabDefinition): string {
	const words = tab.title
		.replace(/[^\p{L}\p{N}]+/gu, " ")
		.trim()
		.split(/\s+/)
	return (words.find((word) => word.length >= 4) ?? tab.folder).toLowerCase()
}

/** The h1 of the page now open, which is its page title. */
export async function openPageTitle(page: Page): Promise<string> {
	const title = await page.getByRole("heading", { level: 1 }).textContent()
	if (title === null || title.trim().length === 0) {
		throw new Error("the open page has no heading")
	}
	return title.trim()
}

/** Open the Docs Portal search dialog, from the trigger a desktop shows. */
export async function openSearch(page: Page): Promise<void> {
	await waitForIsland(page)
	// The header control's name shows the keyboard shortcut, so match on "search".
	await page
		.getByRole("button", { name: /search/i })
		.first()
		.click()
	await page.locator('[role="dialog"]').waitFor()
}

/** Open the search dialog from the icon button a phone shows instead of the full-width trigger. */
export async function openPhoneSearch(page: Page): Promise<void> {
	await waitForIsland(page)
	await page.getByRole("button", { name: "Open Search" }).click()
	await page.locator('[role="dialog"]').waitFor()
}

/** Open the home layout's header menu, the navigation a phone shows below the lg breakpoint. */
export async function openPhoneMenu(page: Page): Promise<void> {
	await waitForIsland(page)
	await page.getByRole("button", { name: "Toggle Menu" }).click()
	// The trigger and the panel it opens carry the open state.
	await page.locator("#nd-nav [data-state='open']").first().waitFor()
}

/** Open the notebook layout's sidebar drawer, the sidebar a phone reaches through the header. */
export async function openSidebarDrawer(page: Page): Promise<void> {
	await waitForIsland(page)
	await page.getByRole("button", { name: "Open Sidebar" }).click()
	await page.locator('#nd-sidebar-mobile[data-state="open"]').waitFor()
}

/** Open the table-of-contents popover that stands in for the sidebar's contents on a phone. */
export async function openTocPopover(page: Page): Promise<void> {
	await waitForIsland(page)
	await page.locator(SUBNAV_TRIGGER).click()
	await page.locator(`${SUBNAV_TRIGGER}[aria-expanded="true"]`).waitFor()
}

/** The subnav row's table-of-contents trigger; only a docs page with headings renders it. */
export const SUBNAV_TRIGGER = "[data-toc-popover-trigger]"

/** The subnav's progress circle, filled once the scroll spy has marked the active heading. */
const SUBNAV_PROGRESS = `${SUBNAV_TRIGGER} [role="progressbar"]`

/** Wait until the page has settled to the state a screenshot should show. */
export async function waitForSettledPage(page: Page): Promise<void> {
	await waitForIsland(page)
	// The scroll spy marks the active heading after hydration and the subnav cross-fades to it.
	await page.waitForFunction((selector: string) => {
		const progress = document.querySelector(selector)
		return progress === null || Number(progress.getAttribute("aria-valuenow")) > 0
	}, SUBNAV_PROGRESS)
	// A page without the row has no cross-fade, so any transition still running there counts.
	await page.waitForFunction((selector: string) => {
		const trigger = document.querySelector(selector)
		const animations =
			trigger === null ? document.getAnimations() : trigger.getAnimations({ subtree: true })
		return animations.every((animation) => animation.playState !== "running")
	}, SUBNAV_TRIGGER)
}

/** Choose `to` in the Tab switcher. */
export async function switchTab(page: Page, from: TabDefinition, to: TabDefinition): Promise<void> {
	await waitForIsland(page)
	const headerTab = page.locator("#nd-subnav").getByRole("link", { name: to.title, exact: true })
	if (await headerTab.isVisible()) {
		await headerTab.click()
		return
	}
	await page.getByRole("button", { name: from.title }).click()
	await page.getByRole("dialog").getByRole("link", { name: to.title, exact: true }).click()
}
