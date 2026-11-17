import type { Page } from "@playwright/test"
import { DOCS_BASE_PATH } from "../src/lib/tabs"
import { NOT_FOUND_PATH, openPage } from "./built-site"
import {
	openPhoneMenu,
	openPhoneSearch,
	openSearch,
	openSidebarDrawer,
	openTocPopover,
	waitForSettledPage,
} from "./docs-portal"
import { expect, test } from "./fixtures"
import { TEST_VIEWPORT_HEIGHT_PX } from "./viewports"

/** The card role (`radius.md`) in px: the largest corner the Docs Portal draws. */
const CARD_RADIUS_PX = 6

/** A full-round pill or circle: `rounded-full` is a shape, not a corner treatment. */
const FULL_ROUND_PX = 1_000_000

const LANDING_PATH = `${DOCS_BASE_PATH}/`

/** A docs page with headings, so it also carries the table-of-contents popover on a phone. */
const DOCS_PAGE_PATH = `${DOCS_BASE_PATH}/cli/`

/** An element whose corner is too round, or whose shadow paints something. */
interface ShapeOffender {
	readonly element: string
	readonly radius?: string
	readonly shadow?: string
}

/** The elements on the page, as a selector that reads them the way the browser renders them. */
const ALL_ELEMENTS = "body *"

/** Every element whose corner is rounder than a card, leaving a full-round pill or circle alone. */
async function tooRound(page: Page): Promise<readonly ShapeOffender[]> {
	return page.evaluate(
		({ selector, cardPx, fullRoundPx }) =>
			[...document.querySelectorAll(selector)].flatMap((element) => {
				const style = getComputedStyle(element)
				const corners = [
					style.borderTopLeftRadius,
					style.borderTopRightRadius,
					style.borderBottomRightRadius,
					style.borderBottomLeftRadius,
				].map((corner) => Number.parseFloat(corner))
				const roundest = Math.max(...corners)
				if (roundest <= cardPx || roundest >= fullRoundPx) {
					return []
				}
				return [{ element: element.outerHTML.slice(0, 120), radius: style.borderTopLeftRadius }]
			}),
		{ selector: ALL_ELEMENTS, cardPx: CARD_RADIUS_PX, fullRoundPx: FULL_ROUND_PX },
	)
}

/** Every element whose computed `box-shadow` paints something. */
async function shadowed(page: Page): Promise<readonly ShapeOffender[]> {
	return page.evaluate((selector) => {
		/**
		 * Whether a computed `box-shadow` paints anything. Tailwind's ring utilities compile to a
		 * shadow chain whose layers stay fully transparent until focus, so `none` is not the only
		 * shadow that paints nothing.
		 */
		function paintsShadow(boxShadow: string): boolean {
			if (boxShadow === "none") {
				return false
			}
			return boxShadow.split(/,(?![^()]*\))/).some((layer) => {
				const colour = /(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\([^)]*\)/.exec(layer)
				const inner = (colour?.[0] ?? "").slice((colour?.[0] ?? "").indexOf("(") + 1, -1)
				const alpha = inner.includes("/") ? inner.split("/")[1] : inner.split(",")[3]
				return colour === null || Number.parseFloat(alpha ?? "1") > 0
			})
		}
		return [...document.querySelectorAll(selector)].flatMap((element) => {
			const shadow = getComputedStyle(element).boxShadow
			return paintsShadow(shadow) ? [{ element: element.outerHTML.slice(0, 120), shadow }] : []
		})
	}, ALL_ELEMENTS)
}

/** One rendered surface: the page, the width, and whatever has to be opened on it first. */
interface Surface {
	readonly name: string
	readonly path: string
	readonly widthPx: number
	readonly open: ((page: Page) => Promise<void>) | null
}

const SURFACES: readonly Surface[] = [
	{ name: "the Landing Page", path: LANDING_PATH, widthPx: 1280, open: null },
	{ name: "the 404 page", path: NOT_FOUND_PATH, widthPx: 1280, open: null },
	{ name: "a docs page", path: DOCS_PAGE_PATH, widthPx: 1280, open: null },
	{ name: "the open search dialog", path: DOCS_PAGE_PATH, widthPx: 1280, open: openSearch },
	{ name: "the Landing Page", path: LANDING_PATH, widthPx: 390, open: null },
	{ name: "the 404 page", path: NOT_FOUND_PATH, widthPx: 390, open: null },
	{ name: "a docs page", path: DOCS_PAGE_PATH, widthPx: 390, open: null },
	{ name: "the open search dialog", path: DOCS_PAGE_PATH, widthPx: 390, open: openPhoneSearch },
	{ name: "the open phone menu", path: LANDING_PATH, widthPx: 390, open: openPhoneMenu },
	{ name: "the open sidebar drawer", path: DOCS_PAGE_PATH, widthPx: 390, open: openSidebarDrawer },
	{
		name: "the open table-of-contents popover",
		path: DOCS_PAGE_PATH,
		widthPx: 390,
		open: openTocPopover,
	},
]

for (const surface of SURFACES) {
	test(`no corner is rounder than a card and nothing paints a shadow on ${surface.name} at ${surface.widthPx}px`, async ({
		page,
	}) => {
		await page.setViewportSize({ width: surface.widthPx, height: TEST_VIEWPORT_HEIGHT_PX })
		await openPage(page, surface.path)
		await waitForSettledPage(page)
		if (surface.open !== null) {
			await surface.open(page)
		}

		expect(await tooRound(page), `${surface.name} at ${surface.widthPx}px`).toEqual([])
		expect(await shadowed(page), `${surface.name} at ${surface.widthPx}px`).toEqual([])
	})
}
