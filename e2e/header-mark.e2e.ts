import type { Page } from "@playwright/test"
import { PORTAL_NAME } from "../src/lib/portal"
import { DOCS_BASE_PATH } from "../src/lib/tabs"
import { openPage, pageName, pagesUnderTest } from "./built-site"
import { waitForIsland } from "./docs-portal"
import { expect, test } from "./fixtures"
import { TEST_VIEWPORT_HEIGHT_PX, TEST_WIDTHS_PX } from "./viewports"

/** The Landing Page, the one destination the header mark takes on every page (docs#75). */
const LANDING_URL = `${DOCS_BASE_PATH}/`

/** The header each layout renders: the home layout's, and the notebook layout's. */
const HEADER = "#nd-nav, #nd-subnav"

/** The one link a reader is told the portal's name by: the mark in the page's header. */
function headerMark(page: Page) {
	return page.locator(HEADER).getByRole("link", { name: PORTAL_NAME, exact: true })
}

for (const widthPx of TEST_WIDTHS_PX) {
	for (const path of pagesUnderTest()) {
		test(`the ${pageName(path)} page carries one header mark at ${widthPx}px`, async ({ page }) => {
			await page.setViewportSize({ width: widthPx, height: TEST_VIEWPORT_HEIGHT_PX })
			await openPage(page, path)
			await waitForIsland(page)

			// One mark, in the header itself at a phone's width too, never behind the menu.
			await expect(headerMark(page)).toHaveCount(1)
			await expect(headerMark(page)).toBeVisible()
			await expect(headerMark(page)).toHaveAttribute("href", LANDING_URL)
		})
	}
}
