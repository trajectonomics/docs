import type { Page } from "@playwright/test"
import { openPage } from "./built-site"
import { SUBNAV_TRIGGER, waitForSettledPage } from "./docs-portal"
import { expect, test } from "./fixtures"
import { TEST_VIEWPORT_HEIGHT_PX } from "./viewports"

/** The phone width the issue names, and the width every committed 390px screenshot shows. */
const PHONE_WIDTH_PX = 390

/** Every width the subnav row is shown at: Fumadocs hides its table-of-contents popover from xl up. */
const WIDTHS_BELOW_XL_PX = [390, 768, 1024, 1279] as const

/** A docs page whose headings give the subnav row a table of contents. */
const PAGE_WITH_SUBNAV = "/docs/cli/"

/** Open a docs page at `widthPx` and check the row clips the labels it cross-fades. */
async function checkRowIsClipped(page: Page, widthPx: number): Promise<void> {
	await page.setViewportSize({ width: widthPx, height: TEST_VIEWPORT_HEIGHT_PX })
	await openPage(page, PAGE_WITH_SUBNAV)
	const trigger = page.locator(SUBNAV_TRIGGER)
	await expect(trigger).toBeVisible()

	const bar = await trigger.evaluate((element) => {
		const header = element.closest("header")
		return {
			overflow: getComputedStyle(element).overflow,
			bottom: element.getBoundingClientRect().bottom,
			hairline: header === null ? undefined : header.getBoundingClientRect().bottom,
		}
	})

	// The labels cross-fade by translating a full line, so the row must clip them; otherwise the
	// outgoing label paints over the header and the incoming one over the hairline.
	expect(bar.overflow).toBe("hidden")
	// The clip ends at the header's hairline, so a clipped label cannot reach it.
	expect(bar.hairline).toBeDefined()
	expect(bar.bottom).toBeLessThanOrEqual(bar.hairline ?? Number.NaN)
}

for (const widthPx of WIDTHS_BELOW_XL_PX) {
	test(`the subnav row clips its cross-fade so no label leaves the bar at ${widthPx}px`, async ({
		page,
	}) => {
		await checkRowIsClipped(page, widthPx)
	})
}

test.describe("the dark theme", () => {
	test.use({ colorScheme: "dark" })

	test(`the subnav row clips its cross-fade at ${PHONE_WIDTH_PX}px`, async ({ page }) => {
		await checkRowIsClipped(page, PHONE_WIDTH_PX)
	})
})

test("the subnav row settles on one label, never mid-fade", async ({ page }) => {
	await page.setViewportSize({ width: PHONE_WIDTH_PX, height: TEST_VIEWPORT_HEIGHT_PX })
	await openPage(page, PAGE_WITH_SUBNAV)
	await waitForSettledPage(page)

	const opacities = await page
		.locator(SUBNAV_TRIGGER)
		.evaluate((element) =>
			[...element.querySelectorAll(":scope > span > span")].map(
				(label) => getComputedStyle(label).opacity,
			),
		)

	expect(
		opacities.filter((opacity) => opacity === "1"),
		"one label is fully shown",
	).toHaveLength(1)
	expect(
		opacities.filter((opacity) => opacity === "0"),
		"the other fully hidden",
	).toHaveLength(1)
})
