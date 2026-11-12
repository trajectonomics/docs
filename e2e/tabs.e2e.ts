import { TABS, tabUrl } from "../src/lib/tabs"
import { openPageTitle, otherTab, switchTab } from "./docs-portal"
import { expect, test } from "./fixtures"

const [operatorTab] = TABS

test("switching Tab changes the URL, heading and sidebar", async ({ page }) => {
	const other = otherTab(operatorTab)
	await page.goto(tabUrl(operatorTab))
	const operatorTitle = await openPageTitle(page)

	await switchTab(page, operatorTab, other)
	await expect(page).toHaveURL(tabUrl(other))
	await expect.poll(() => openPageTitle(page)).not.toBe(operatorTitle)
	const otherTitle = await openPageTitle(page)
	await expect(
		page.getByRole("complementary").getByRole("link", { name: otherTitle }),
	).toBeVisible()
	await expect(
		page.getByRole("complementary").getByRole("link", { name: operatorTitle }),
	).toHaveCount(0)

	await page.goBack()
	await expect(page).toHaveURL(tabUrl(operatorTab))
	await expect.poll(() => openPageTitle(page)).toBe(operatorTitle)
	await expect(
		page.getByRole("complementary").getByRole("link", { name: operatorTitle }),
	).toBeVisible()
})

test("a Tab switch is client-side navigation, so the Docs island stays mounted", async ({
	page,
}) => {
	let documentRequests = 0
	page.on("request", (request) => {
		if (request.resourceType() === "document") {
			documentRequests++
		}
	})
	await page.goto(tabUrl(operatorTab))
	const operatorTitle = await openPageTitle(page)
	await page.evaluate(() => {
		// The Docs island's own element: if Astro remounts the island, the marker is gone.
		document
			.querySelector("main")
			?.closest("astro-island")
			?.setAttribute("data-island-probe", "mounted")
	})

	await switchTab(page, operatorTab, otherTab(operatorTab))
	await expect.poll(() => openPageTitle(page)).not.toBe(operatorTitle)

	await expect(page.locator("[data-island-probe='mounted']")).toBeAttached()
	expect(documentRequests, "the Tab switch did not reload the document").toBe(1)
})
