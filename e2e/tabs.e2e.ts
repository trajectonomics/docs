import { DEFAULT_TAB, tabUrl } from "../src/lib/tabs"
import { openPageTitle, otherTab, switchTab } from "./docs-portal"
import { expect, test } from "./fixtures"

test("the Docs Portal opens the default Tab, and switching Tab changes the URL, heading and sidebar", async ({
	page,
}) => {
	const other = otherTab(DEFAULT_TAB)
	await page.goto("/docs")
	await expect(page).toHaveURL(tabUrl(DEFAULT_TAB))
	const defaultTitle = await openPageTitle(page)

	await switchTab(page, DEFAULT_TAB, other)
	await expect(page).toHaveURL(tabUrl(other))
	await expect.poll(() => openPageTitle(page)).not.toBe(defaultTitle)
	const otherTitle = await openPageTitle(page)
	await expect(
		page.getByRole("complementary").getByRole("link", { name: otherTitle }),
	).toBeVisible()
	await expect(
		page.getByRole("complementary").getByRole("link", { name: defaultTitle }),
	).toHaveCount(0)

	await page.goBack()
	await expect(page).toHaveURL(tabUrl(DEFAULT_TAB))
	await expect.poll(() => openPageTitle(page)).toBe(defaultTitle)
	await expect(
		page.getByRole("complementary").getByRole("link", { name: defaultTitle }),
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
	await page.goto(tabUrl(DEFAULT_TAB))
	const defaultTitle = await openPageTitle(page)
	await page.evaluate(() => {
		// The Docs island's own element: if Astro remounts the island, the marker is gone.
		document
			.querySelector("main")
			?.closest("astro-island")
			?.setAttribute("data-island-probe", "mounted")
	})

	await switchTab(page, DEFAULT_TAB, otherTab(DEFAULT_TAB))
	await expect.poll(() => openPageTitle(page)).not.toBe(defaultTitle)

	await expect(page.locator("[data-island-probe='mounted']")).toBeAttached()
	expect(documentRequests, "the Tab switch did not reload the document").toBe(1)
})
