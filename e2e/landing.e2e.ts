import { readFileSync } from "node:fs"
import { parseSyncManifest, SYNC_MANIFEST_PATH } from "../src/lib/docs-sync/manifest"
import { releaseLine } from "../src/lib/release-line"
import { DOCS_BASE_PATH, TABS, tabUrl } from "../src/lib/tabs"
import { openSearch, otherTab, searchTerm } from "./docs-portal"
import { expect, test } from "./fixtures"

const LANDING_PATH = `${DOCS_BASE_PATH}/`

/** The release line the built page must state, read the way the build reads it. */
const RELEASE_LINE = releaseLine(parseSyncManifest(readFileSync(SYNC_MANIFEST_PATH, "utf8")))

/** A Site Home document, so the browser test never asks `wrangler dev` for the page at `/`. */
const SITE_HOME_DOCUMENT = "<!doctype html><html lang='en'><title>Site Home</title></html>"

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

test("each audience entry says what its reader gets", async ({ page }) => {
	await page.goto(LANDING_PATH)

	for (const tab of TABS) {
		const link = page.getByRole("link", { name: tab.entry, exact: true })
		const descriptionId = await link.getAttribute("aria-describedby")
		expect(descriptionId, `${tab.folder} entry describes its reader's next step`).not.toBeNull()
		await expect(page.locator(`#${descriptionId}`)).toHaveText(tab.description)
	}
})

test("the Landing Page states the release the docs were synced from", async ({ page }) => {
	await page.goto(LANDING_PATH)

	await expect(page.getByText(RELEASE_LINE, { exact: true })).toBeVisible()
})

test("the Landing Page ends with Site Home, Source and License links", async ({ page }) => {
	await page.goto(LANDING_PATH)

	await expect(page.getByRole("link", { name: "Site Home", exact: true })).toHaveAttribute(
		"href",
		"/",
	)
	await expect(page.getByRole("link", { name: "Source", exact: true })).toHaveAttribute(
		"href",
		"https://github.com/trajectonomics/docs",
	)
	await expect(page.getByRole("link", { name: "License", exact: true })).toHaveAttribute(
		"href",
		"https://github.com/trajectonomics/docs/blob/main/LICENSE",
	)
})

test("the ending's Site Home link loads / as one document and never prefetches", async ({
	page,
}) => {
	await page.goto(LANDING_PATH)
	await page.route(
		(url) => url.pathname === "/",
		(route) => route.fulfill({ status: 200, contentType: "text/html", body: SITE_HOME_DOCUMENT }),
	)

	const siteHomeRequests: string[] = []
	page.on("request", (request) => {
		if (new URL(request.url()).pathname === "/") {
			siteHomeRequests.push(request.resourceType())
		}
	})

	const link = page.getByRole("link", { name: "Site Home", exact: true })
	await link.hover()
	// Longer than Astro's 80ms hover prefetch debounce.
	await page.waitForTimeout(300)
	expect(siteHomeRequests, "hovering fetched the Site Home").toEqual([])

	await link.click()
	await expect.poll(() => siteHomeRequests).toEqual(["document"])
	await expect(page).toHaveURL("/")
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
