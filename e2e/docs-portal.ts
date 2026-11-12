import type { Page } from "@playwright/test"
import { TABS, type TabDefinition } from "../src/lib/tabs"

/** Wait until the Docs island has hydrated, so its server-rendered controls respond to clicks. */
async function waitForDocsIsland(page: Page): Promise<void> {
	// Astro drops the `ssr` attribute when the island finishes hydrating.
	await page.locator("astro-island[component-export='Docs']:not([ssr])").waitFor()
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

/** Open the Docs Portal search dialog. */
export async function openSearch(page: Page): Promise<void> {
	await waitForDocsIsland(page)
	// The header control's name shows the keyboard shortcut, so match on "search".
	await page
		.getByRole("button", { name: /search/i })
		.first()
		.click()
}

/** Choose `to` in the Tab switcher. */
export async function switchTab(page: Page, from: TabDefinition, to: TabDefinition): Promise<void> {
	await waitForDocsIsland(page)
	const headerTab = page.locator("#nd-subnav").getByRole("link", { name: to.title, exact: true })
	if (await headerTab.isVisible()) {
		await headerTab.click()
		return
	}
	await page.getByRole("button", { name: from.title }).click()
	await page.getByRole("dialog").getByRole("link", { name: to.title, exact: true }).click()
}
