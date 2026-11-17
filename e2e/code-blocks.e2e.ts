import { openPage, pageName } from "./built-site"
import { expect, test } from "./fixtures"
import { TEST_VIEWPORT_HEIGHT_PX } from "./viewports"

/** The Quickstart page, whose install fence is wider than a phone column. */
const CLI_PAGE = "/docs/cli/"

test("a CLI code block scrolls inside its own container, not the page", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: TEST_VIEWPORT_HEIGHT_PX })
	await openPage(page, CLI_PAGE)

	const containers = page.locator("#nd-page [role='region']")
	await expect(containers.first(), `${pageName(CLI_PAGE)} shows a code block`).toBeVisible()

	const blocks = await page.evaluate(() => {
		const found = [...document.querySelectorAll<HTMLElement>("#nd-page [role='region']")]
		return found.map((block) => {
			block.scrollLeft = block.scrollWidth
			return {
				overflows: block.scrollWidth > block.clientWidth,
				scrolledLeft: block.scrollLeft,
			}
		})
	})
	const pageScroll = await page.evaluate(() => ({
		scrollWidth: document.documentElement.scrollWidth,
		innerWidth: window.innerWidth,
		scrollX: window.scrollX,
	}))

	const overflowing = blocks.filter((block) => block.overflows)
	expect(overflowing.length, "a code block is wider than its column").toBeGreaterThan(0)
	for (const block of overflowing) {
		expect(block.scrolledLeft, "the block scrolls itself").toBeGreaterThan(0)
	}
	expect(pageScroll.scrollWidth).toBeLessThanOrEqual(pageScroll.innerWidth)
	expect(pageScroll.scrollX).toBe(0)
})
