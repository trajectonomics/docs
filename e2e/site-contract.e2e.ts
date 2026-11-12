import { DOCS_BASE_PATH, TABS, tabUrl } from "../src/lib/tabs"
import { expect, test } from "./fixtures"

const LANDING_PATH = `${DOCS_BASE_PATH}/`

for (const tab of TABS) {
	test(`the ${tab.audience} Tab index page is served with a heading`, async ({ page }) => {
		const response = await page.goto(tabUrl(tab))

		expect(response?.status()).toBe(200)
		await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
	})
}

test("an unknown path shows the Docs Portal 404 page with a way back", async ({ page }) => {
	const response = await page.goto("/docs/no-such-page/")

	expect(response?.status()).toBe(404)
	await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible()
	await expect(page.getByRole("link", { name: "Docs Portal" })).toHaveAttribute(
		"href",
		LANDING_PATH,
	)
	await expect(page.getByRole("button", { name: /search/i }).first()).toBeVisible()
})
