import { DOCS_BASE_PATH, TABS, tabUrl } from "../src/lib/tabs"
import { openSearch, otherTab, searchTerm } from "./docs-portal"
import { expect, test } from "./fixtures"

const LANDING_PATH = `${DOCS_BASE_PATH}/`

test("/docs reaches the Landing Page at /docs/", async ({ page }) => {
	const response = await page.goto(DOCS_BASE_PATH)

	expect(response?.status()).toBe(200)
	await expect(page).toHaveURL(LANDING_PATH)
	await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
})

test("the Landing Page has one entry per audience, each linking to its Tab", async ({ page }) => {
	await page.goto(LANDING_PATH)

	const entries = page.getByRole("main").getByRole("link", { name: /^For / })
	await expect(entries).toHaveCount(TABS.length)
	for (const tab of TABS) {
		await expect(page.getByRole("link", { name: tab.entry, exact: true })).toHaveAttribute(
			"href",
			tabUrl(tab),
		)
	}
})

test("an audience entry opens its Tab", async ({ page }) => {
	const tab = otherTab(TABS[0])
	await page.goto(LANDING_PATH)

	await page.getByRole("link", { name: tab.entry, exact: true }).click()

	await expect(page).toHaveURL(tabUrl(tab))
})

test("search opens on the Landing Page and does not offer the Landing Page", async ({ page }) => {
	await page.goto(LANDING_PATH)

	await openSearch(page)
	await page.getByRole("combobox", { name: "Search" }).fill(searchTerm(TABS[0]))

	await expect(page.getByRole("option").first()).toBeVisible()
	await expect(page.getByRole("option").filter({ hasText: "Trajectonomics Docs" })).toHaveCount(0)
})
