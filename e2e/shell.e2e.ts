import { expect, test } from "./fixtures"
import { box, DOCS_PAGE_PATH, openDocsPage, readingBlocks } from "./shell"
import { TEST_WIDTHS_PX } from "./viewports"

/** The one header row's height: `--spacing(14)`, which Fumadocs sets for the sidebar Tab mode. */
const HEADER_HEIGHT_PX = 56

/** The reading column's measure, the design brief's 900px page column (ADR 0009). */
const READING_MEASURE_PX = 900

/** The header's own inset (`md:px-6`), which the wordmark opens the row from. */
const HEADER_INSET_PX = 24

/**
 * The reading column's width at each width the shell is looked at: the 900px measure where the page
 * track can hold it, and the track's own content box where it cannot (docs#101).
 */
const READING_WIDTH_PX: Readonly<Record<number, number>> = { 390: 358, 1280: 680, 2000: 900 }

/** The table of contents column's width, from `xl` up. */
const CONTENTS_WIDTH_PX = 268

/** The widths the shell is looked at: wide screen, desktop, and phone. */
const WIDE_WIDTH_PX = 2000
const DESKTOP_WIDTH_PX = 1280

test("the shell spans the page and the header is one row", async ({ page }) => {
	await openDocsPage(page, WIDE_WIDTH_PX)
	const viewport = await page.evaluate(() => ({ width: window.innerWidth }))
	const header = await box(page, "#nd-subnav")
	const tabs = await box(page, "[data-shell-tabs]")
	const wordmark = await box(page, "#nd-subnav [data-header-body] a")
	const sidebar = await box(page, "#nd-sidebar")
	const contents = await box(page, "#nd-toc")
	const blocks = await readingBlocks(page)

	expect(header, "the header is rendered").not.toBeNull()
	expect(header?.x, "the header starts at the page's left edge").toBe(0)
	expect(header?.width, "the header spans the page").toBe(viewport.width)
	expect(header?.height, "the header is one 56px row").toBe(HEADER_HEIGHT_PX)
	expect(
		await page.locator("#nd-subnav [data-header-tabs]").count(),
		"the header draws no second Tab row",
	).toBe(0)

	expect(sidebar?.x, "the sidebar starts at the page's left edge").toBe(0)
	expect(contents, "the table of contents is rendered").not.toBeNull()
	expect(
		(contents?.x ?? 0) + (contents?.width ?? 0),
		"the table of contents ends at the page's right edge",
	).toBe(viewport.width)

	// The Tabs are centred on the page itself, not on the space the wordmark leaves.
	expect(tabs, "the Tabs are in the header").not.toBeNull()
	expect(
		Math.abs((tabs?.x ?? 0) + (tabs?.width ?? 0) / 2 - viewport.width / 2),
	).toBeLessThanOrEqual(1)
	// The wordmark keeps the header's own inset, so the row starts where the page does.
	expect(wordmark?.x, "the wordmark sits at the header's inset").toBe(HEADER_INSET_PX)

	// Every block of the column — the title, the prose, a code block — keeps the measure.
	const reading = blocks.find((block) => block.width === READING_MEASURE_PX)
	expect(reading, "some block of the reading column takes the measure").toBeDefined()
	expect(
		blocks.map((block) => block.width),
		"every block is at most the measure",
	).toEqual(blocks.map(() => READING_MEASURE_PX))
	expect(
		blocks.map((block) => Math.round(block.x)),
		"every block starts at the measure's left edge",
	).toEqual(blocks.map(() => Math.round(reading?.x ?? 0)))

	// The measure sits in the middle of the track the sidebar and the contents leave it.
	const sidebarRight = (sidebar?.x ?? 0) + (sidebar?.width ?? 0)
	const trackCentre = sidebarRight + ((contents?.x ?? 0) - sidebarRight) / 2
	const columnCentre = (reading?.x ?? 0) + (reading?.width ?? 0) / 2
	expect(
		Math.abs(columnCentre - trackCentre),
		"the reading column is centred between the sidebar and the contents",
	).toBeLessThanOrEqual(1)
})

test(`the reading column keeps its width and its place on the ${DOCS_PAGE_PATH} page`, async ({
	page,
}) => {
	for (const widthPx of TEST_WIDTHS_PX) {
		await openDocsPage(page, widthPx)
		const blocks = await readingBlocks(page)
		expect(blocks.length, "the page renders its reading column").toBeGreaterThan(0)
		expect(
			blocks.map((block) => block.width),
			`every block keeps its width at ${widthPx}px`,
		).toEqual(blocks.map(() => READING_WIDTH_PX[widthPx]))
		expect(
			blocks.map((block) => Math.round(block.x)),
			`every block keeps its left edge at ${widthPx}px`,
		).toEqual(blocks.map(() => Math.round(blocks[0]?.x ?? 0)))

		// The one header row spans the page at every width, the phone's included, and stays one row.
		const header = await box(page, "#nd-subnav")
		expect(header?.width, `the header spans the page at ${widthPx}px`).toBe(widthPx)
		expect(header?.height, `the header is one 56px row at ${widthPx}px`).toBe(HEADER_HEIGHT_PX)

		// From xl up the contents column sits at the page's right edge; a phone shows none.
		const contents = await box(page, "#nd-toc")
		expect(contents?.width, `the contents column's width at ${widthPx}px`).toBe(
			widthPx >= DESKTOP_WIDTH_PX ? CONTENTS_WIDTH_PX : 0,
		)
		if (widthPx >= DESKTOP_WIDTH_PX) {
			expect(
				(contents?.x ?? 0) + (contents?.width ?? 0),
				`the contents end at the page's right edge at ${widthPx}px`,
			).toBe(widthPx)
		} else {
			expect((await box(page, "#nd-page"))?.width, "the page column takes the phone").toBe(widthPx)
		}
	}
})
