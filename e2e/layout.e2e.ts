import { openPage, pageName, pagesUnderTest } from "./built-site"
import { expect, test } from "./fixtures"
import { TEST_VIEWPORT_HEIGHT_PX, TEST_WIDTHS_PX } from "./viewports"

for (const widthPx of TEST_WIDTHS_PX) {
	for (const path of pagesUnderTest()) {
		test(`the ${pageName(path)} page scrolls only downwards at ${widthPx}px`, async ({ page }) => {
			await page.setViewportSize({ width: widthPx, height: TEST_VIEWPORT_HEIGHT_PX })
			await openPage(page, path)
			const overflows = await page.evaluate(
				() => document.documentElement.scrollWidth > window.innerWidth,
			)

			expect(overflows, `${pageName(path)} has horizontal scroll at ${widthPx}px`).toBe(false)
			await expect(
				page.getByRole("heading", { level: 1 }),
				`${pageName(path)} shows its heading at ${widthPx}px`,
			).toBeInViewport({ ratio: 1 })
		})
	}
}
