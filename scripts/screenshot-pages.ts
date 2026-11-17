/*
 * The curated screenshot set `docs/design/portal-shell.md` requires and commits under
 * `docs/screenshots/`: the built Docs Portal at 1280, 2000 and 390px in light and dark, plus the
 * surfaces no plain page load opens. `scripts/screenshots.ts` captures it.
 */
import { join } from "node:path"
import type { Page } from "@playwright/test"
import { openPhoneMenu, openSearch } from "../e2e/docs-portal"
import { TEST_WIDTHS_PX } from "../e2e/viewports"

/** Fumadocs' copy control on a code block: the "Copy Text" button in the block's figure. */
const COPY_CONTROL = "#nd-page figure button[aria-live='polite']"

/** One page the set shows, the widths it is shown at, and any state it needs opened first. */
interface CuratedPage {
	readonly path: string
	readonly name: string
	readonly widthsPx: readonly number[]
	readonly drive: ((page: Page) => Promise<void>) | null
	/** Whether the shot shows the whole page. A fixed overlay covers the viewport, so its shot does too. */
	readonly fullPage: boolean
}

/** One committed screenshot: the theme, width and page it shows, and the file it lands in. */
export interface CuratedShot {
	readonly theme: "light" | "dark"
	readonly widthPx: number
	readonly path: string
	readonly drive: ((page: Page) => Promise<void>) | null
	readonly fullPage: boolean
	readonly file: string
}

/** Show the hover state of a code block's copy control, which the plain grid never reaches. */
async function hoverCopyControl(page: Page): Promise<void> {
	await page.hover(COPY_CONTROL)
}

/**
 * The pages the set shows, each under the file name it is committed as. The search dialog and the
 * phone menu are here because they are the surfaces where a shadow becomes a hairline (docs#90).
 */
const PAGES: readonly CuratedPage[] = [
	{ path: "/docs/", name: "landing-page", widthsPx: TEST_WIDTHS_PX, drive: null, fullPage: true },
	{
		path: "/docs/no-such-page/",
		name: "not-found",
		widthsPx: TEST_WIDTHS_PX,
		drive: null,
		fullPage: true,
	},
	{ path: "/docs/cli/", name: "cli", widthsPx: TEST_WIDTHS_PX, drive: null, fullPage: true },
	{
		path: "/docs/cli/commands/tx/",
		name: "cli-commands-tx",
		widthsPx: TEST_WIDTHS_PX,
		drive: null,
		fullPage: true,
	},
	{
		path: "/docs/cli/",
		name: "cli-hover",
		widthsPx: [1280],
		drive: hoverCopyControl,
		fullPage: true,
	},
	{
		path: "/docs/cli/",
		name: "search-dialog",
		widthsPx: [1280],
		drive: openSearch,
		fullPage: false,
	},
	{
		path: "/docs/",
		name: "phone-menu",
		widthsPx: [390],
		drive: openPhoneMenu,
		fullPage: false,
	},
]

/** Every curated screenshot, as `<root>/<theme>/<width>/<page>.png`. */
export function curatedShots(root = "docs/screenshots"): CuratedShot[] {
	const themes = ["light", "dark"] as const
	return themes.flatMap((theme) =>
		PAGES.flatMap((page) =>
			page.widthsPx.map((widthPx) => ({
				theme,
				widthPx,
				path: page.path,
				drive: page.drive,
				fullPage: page.fullPage,
				file: join(root, theme, String(widthPx), `${page.name}.png`),
			})),
		),
	)
}
