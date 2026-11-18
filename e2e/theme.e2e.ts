import type { Page } from "@playwright/test"
import { NOT_FOUND_PATH, openPage, pagesUnderTest } from "./built-site"
import { waitForIsland } from "./docs-portal"
import { expect, test } from "./fixtures"
import { expectDarkTheme, seedStoredLightTheme } from "./theme"

/** The page whose links the shell swaps in without a reload, and the Tab one of them opens. */
const LANDING_PATH = "/docs/"
const OPERATOR_PATH = "/docs/cli/"

/** A property on `window`, which only a swapped-in page keeps: a full load gives it back empty. */
const NAVIGATION_MARKER = "__docsPortalNavigationMarker"

async function markDocument(page: Page): Promise<void> {
	await page.evaluate((marker: string) => {
		;(window as unknown as Record<string, unknown>)[marker] = true
	}, NAVIGATION_MARKER)
}

async function documentWasKept(page: Page): Promise<boolean> {
	return page.evaluate(
		(marker: string) => (window as unknown as Record<string, unknown>)[marker] === true,
		NAVIGATION_MARKER,
	)
}

test("no layout offers a control that switches the Theme", async ({ page }) => {
	// One page of each layout the shell draws: the home layout's Landing Page and 404 page, and a
	// docs page (docs#91, docs#89).
	for (const path of [LANDING_PATH, NOT_FOUND_PATH, OPERATOR_PATH]) {
		await openPage(page, path)
		await waitForIsland(page)
		expect(
			await page.locator("[data-theme-switch], button[aria-label*='heme']").count(),
			`the page at ${path} offers no theme switch`,
		).toBe(0)
	}
})

test.describe("a device set to light with a stored light preference", () => {
	test.use({ colorScheme: "light" })

	for (const path of pagesUnderTest()) {
		test(`a page at ${path} still renders the dark Theme`, async ({ page }) => {
			await seedStoredLightTheme(page)
			await openPage(page, path)
			await expectDarkTheme(page)
		})
	}

	test("the Theme stays dark when the shell swaps the next page in without a reload", async ({
		page,
	}) => {
		await seedStoredLightTheme(page)
		await openPage(page, LANDING_PATH)
		await waitForIsland(page)
		await markDocument(page)

		await page.getByRole("link", { name: /for operators/i }).click()
		await page.waitForURL(`**${OPERATOR_PATH}`)

		expect(await documentWasKept(page), "the page was swapped in place, not loaded again").toBe(
			true,
		)
		await expectDarkTheme(page)
	})
})
