import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { openPage, pageName, pagesUnderTest } from "./built-site"
import { expect, test } from "./fixtures"
import { TEST_VIEWPORT_HEIGHT_PX, TEST_WIDTHS_PX } from "./viewports"

const SCREENSHOTS_ROOT = fileURLToPath(new URL("../screenshots/", import.meta.url))

for (const widthPx of TEST_WIDTHS_PX) {
	for (const path of pagesUnderTest()) {
		test(`a screenshot of the ${pageName(path)} page is captured at ${widthPx}px`, async ({
			page,
		}) => {
			await page.setViewportSize({ width: widthPx, height: TEST_VIEWPORT_HEIGHT_PX })
			await openPage(page, path)
			await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
			await page.screenshot({
				path: join(SCREENSHOTS_ROOT, String(widthPx), `${pageName(path)}.png`),
				fullPage: true,
			})
		})
	}
}
