import type { Page } from "@playwright/test"
import { TABS, type TabDefinition } from "../src/lib/tabs"

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

/** Open the search dialog; the header control shows the shortcut, so match on "search". */
export async function openSearch(page: Page): Promise<void> {
	await page
		.getByRole("button", { name: /search/i })
		.first()
		.click()
}

/** Choose `to` in the Tab switcher, which is named after the Tab currently open. */
export async function switchTab(page: Page, from: TabDefinition, to: TabDefinition): Promise<void> {
	await page.getByRole("button", { name: from.title }).click()
	await page.getByRole("dialog").getByRole("link", { name: to.title, exact: true }).click()
}
