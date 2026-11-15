import { openPage } from "./built-site"
import { settleDocsPage } from "./docs-portal"
import { expect, test } from "./fixtures"
import { TEST_VIEWPORT_HEIGHT_PX } from "./viewports"

/** The phone width the subnav row is shown at; it is hidden from the xl breakpoint up. */
const PHONE_WIDTH_PX = 390

/** Every width the subnav row is shown at: Fumadocs hides its table-of-contents popover from xl up. */
const WIDTHS_BELOW_XL_PX = [390, 768, 1024, 1279] as const

/** A docs page whose headings give the subnav row a table of contents. */
const PAGE_WITH_SUBNAV = "/docs/cli/"

for (const widthPx of WIDTHS_BELOW_XL_PX) {
	test(`the subnav row clips its cross-fade so no label leaves the bar at ${widthPx}px`, async ({
		page,
	}) => {
		await page.setViewportSize({ width: widthPx, height: TEST_VIEWPORT_HEIGHT_PX })
		await openPage(page, PAGE_WITH_SUBNAV)
		const trigger = page.locator("[data-toc-popover-trigger]")
		await expect(trigger).toBeVisible()

		const bar = await trigger.evaluate((element) => {
			const box = element.getBoundingClientRect()
			const header = element.closest("header")
			return {
				overflow: getComputedStyle(element).overflow,
				bottom: box.bottom,
				hairline: header === null ? undefined : header.getBoundingClientRect().bottom,
			}
		})

		// The labels cross-fade by translating a full line, so the trigger must clip them; otherwise
		// the outgoing label paints over the header and the incoming one over the hairline.
		expect(bar.overflow).toBe("hidden")
		// The clip ends at the header's hairline, so a clipped label cannot reach it.
		expect(bar.hairline).toBeDefined()
		expect(bar.bottom).toBeLessThanOrEqual(bar.hairline ?? Number.NaN)
	})
}

test("the subnav row is at rest after the screenshot settle wait", async ({ page }) => {
	await page.setViewportSize({ width: PHONE_WIDTH_PX, height: TEST_VIEWPORT_HEIGHT_PX })
	await openPage(page, PAGE_WITH_SUBNAV)
	await settleDocsPage(page)

	const row = await page.locator("[data-toc-popover-trigger]").evaluate((element) => {
		const labels = [...element.querySelectorAll(":scope > span > span")]
		const running = element
			.getAnimations({ subtree: true })
			.filter((animation) => animation.playState === "running")
		return {
			running: running.length,
			opacities: labels.map((label) => getComputedStyle(label).opacity),
		}
	})

	expect(row.running, "the cross-fade has finished").toBe(0)
	expect(
		row.opacities.every((opacity) => opacity === "0" || opacity === "1"),
		"each label is fully shown or fully hidden",
	).toBe(true)
})
