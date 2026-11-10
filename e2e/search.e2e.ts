import { DEFAULT_TAB, tabUrl } from "../src/lib/tabs"
import { openPageTitle, openSearch, otherTab, searchTerm } from "./docs-portal"
import { expect, test } from "./fixtures"

test("searching for a Tab's term finds its page and opens it", async ({ page }) => {
	await page.goto(tabUrl(otherTab(DEFAULT_TAB)))
	const startTitle = await openPageTitle(page)

	await openSearch(page)
	await page.getByRole("combobox", { name: "Search" }).fill(searchTerm(DEFAULT_TAB))

	const result = page.getByRole("option").filter({ hasText: DEFAULT_TAB.title }).first()
	await expect(result).toBeVisible()
	await result.click()

	await expect(page).toHaveURL(tabUrl(DEFAULT_TAB))
	await expect.poll(() => openPageTitle(page)).not.toBe(startTitle)
})
