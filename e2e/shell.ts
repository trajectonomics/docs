import type { Page } from "@playwright/test"
import { DOCS_BASE_PATH } from "../src/lib/tabs"
import { openPage } from "./built-site"
import { waitForSettledPage } from "./docs-portal"
import { TEST_VIEWPORT_HEIGHT_PX } from "./viewports"

/** A docs page with headings, so the shell's table of contents is rendered as well. */
export const DOCS_PAGE_PATH = `${DOCS_BASE_PATH}/cli/`

/** A rendered box: where an element starts and how big it is, in CSS pixels. */
export interface Box {
	readonly x: number
	readonly width: number
	readonly height: number
}

/** The rendered box of the first element the selector matches, or `null` when it matches none. */
export async function box(page: Page, selector: string): Promise<Box | null> {
	return page.evaluate((query) => {
		const element = document.querySelector(query)
		if (element === null) return null
		const rect = element.getBoundingClientRect()
		return { x: rect.x, width: rect.width, height: rect.height }
	}, selector)
}

/** Open the docs page at `widthPx`, with the shell settled. */
export async function openDocsPage(page: Page, widthPx: number): Promise<void> {
	await page.setViewportSize({ width: widthPx, height: TEST_VIEWPORT_HEIGHT_PX })
	await openPage(page, DOCS_PAGE_PATH)
	await waitForSettledPage(page)
}

/**
 * The rendered boxes of the reading column's blocks: the article's own children (the title, its
 * description, the pager), the prose wrapper the MDX pipeline renders for the rest, and a code
 * block inside it. A box with no width (a `display: contents` wrapper, a style or script element)
 * is left out.
 */
export async function readingBlocks(page: Page): Promise<readonly Box[]> {
	return page.evaluate(() =>
		[...document.querySelectorAll("#nd-page > *, #nd-page .prose, #nd-page .prose figure")].flatMap(
			(element) => {
				const rect = element.getBoundingClientRect()
				return rect.width === 0 ? [] : [{ x: rect.x, width: rect.width, height: rect.height }]
			},
		),
	)
}
