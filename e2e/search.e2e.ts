import { TABS, tabUrl } from "../src/lib/tabs"
import { openPageTitle, openSearch, otherTab, searchTerm } from "./docs-portal"
import { expect, test } from "./fixtures"

const [operatorTab] = TABS

test("searching for a Tab's term finds its page and opens it", async ({ page }) => {
	await page.goto(tabUrl(otherTab(operatorTab)))
	const startTitle = await openPageTitle(page)

	await openSearch(page)
	await page.getByRole("combobox", { name: "Search" }).fill(searchTerm(operatorTab))

	const result = page.getByRole("option").filter({ hasText: operatorTab.title }).first()
	await expect(result).toBeVisible()
	await result.click()

	await expect(page).toHaveURL(tabUrl(operatorTab))
	await expect.poll(() => openPageTitle(page)).not.toBe(startTitle)
})
