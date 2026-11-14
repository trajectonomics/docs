import type { Page } from "@playwright/test"
import { SITE_HOME_LABEL, SITE_HOME_PATH } from "../src/lib/layout.shared"
import { DOCS_BASE_PATH, TABS, tabUrl } from "../src/lib/tabs"
import { NOT_FOUND_PATH, openPage } from "./built-site"
import { waitForIsland } from "./docs-portal"
import { expect, test } from "./fixtures"
import { TEST_VIEWPORT_HEIGHT_PX } from "./viewports"

const LANDING_PATH = `${DOCS_BASE_PATH}/`

/** A page that carries the Site Home link, and the small-screen control that reveals its copy. */
interface PageWithSiteHomeLink {
	readonly name: string
	readonly path: string
	/** Accessible name of the control that opens the small-screen copy. */
	readonly control: string
	/** The element the small-screen copy lands in. */
	readonly container: string
}

const PAGES: readonly PageWithSiteHomeLink[] = [
	{
		name: "a Tab page",
		path: tabUrl(TABS[0]),
		control: "Open Sidebar",
		container: "#nd-sidebar-mobile",
	},
	{ name: "the Landing Page", path: LANDING_PATH, control: "Toggle Menu", container: "#nd-nav" },
	{ name: "the 404 page", path: NOT_FOUND_PATH, control: "Toggle Menu", container: "#nd-nav" },
]

/** A Site Home document, so the browser test never asks `wrangler dev` for the page at `/`. */
const SITE_HOME_DOCUMENT = "<!doctype html><html lang='en'><title>Site Home</title></html>"

/** The Site Home link, in the header or wherever the small-screen control opened it. */
function siteHomeLink(page: Page) {
	return page.getByRole("link", { name: SITE_HOME_LABEL, exact: true })
}

for (const widthPx of [1280, 2000]) {
	for (const pageUnderTest of PAGES) {
		test(`the Site Home link is visible in the header of ${pageUnderTest.name} at ${widthPx}px`, async ({
			page,
		}) => {
			await page.setViewportSize({ width: widthPx, height: TEST_VIEWPORT_HEIGHT_PX })
			await openPage(page, pageUnderTest.path)

			const inHeader = page
				.locator("header")
				.getByRole("link", { name: SITE_HOME_LABEL, exact: true })
			await expect(inHeader).toHaveAttribute("href", SITE_HOME_PATH)
			await expect(inHeader).toBeVisible()
			await expect(siteHomeLink(page).filter({ visible: true })).toHaveCount(1)
		})
	}
}

for (const pageUnderTest of PAGES) {
	test(`the Site Home link is behind the ${pageUnderTest.control} control of ${pageUnderTest.name} at 390px`, async ({
		page,
	}) => {
		await page.setViewportSize({ width: 390, height: TEST_VIEWPORT_HEIGHT_PX })
		await openPage(page, pageUnderTest.path)
		await waitForIsland(page)
		await expect(siteHomeLink(page).filter({ visible: true })).toHaveCount(0)

		await page.getByRole("button", { name: pageUnderTest.control }).click()

		const revealed = page
			.locator(pageUnderTest.container)
			.getByRole("link", { name: SITE_HOME_LABEL, exact: true })
		await expect(revealed).toBeVisible()
		await expect(revealed).toHaveAttribute("href", SITE_HOME_PATH)
	})
}

test("clicking the Site Home link loads / as a new document", async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: TEST_VIEWPORT_HEIGHT_PX })
	await openPage(page, tabUrl(TABS[0]))
	await page.route(
		(url) => url.pathname === SITE_HOME_PATH,
		(route) => route.fulfill({ status: 200, contentType: "text/html", body: SITE_HOME_DOCUMENT }),
	)

	const siteHomeRequests: string[] = []
	page.on("request", (request) => {
		if (new URL(request.url()).pathname === SITE_HOME_PATH) {
			siteHomeRequests.push(request.resourceType())
		}
	})

	const link = page.locator("header").getByRole("link", { name: SITE_HOME_LABEL, exact: true })
	await link.hover()
	// Longer than Astro's 80ms hover prefetch debounce.
	await page.waitForTimeout(300)
	expect(siteHomeRequests, "hovering fetched the Site Home").toEqual([])

	await link.click()
	await expect.poll(() => siteHomeRequests).toEqual(["document"])
	await expect(page).toHaveURL(SITE_HOME_PATH)
})
