/*
 * Render the curated screenshots `docs/design/portal-shell.md` requires and commits under
 * `docs/screenshots/`: the built Docs Portal at 1280, 2000 and 390px in light and dark, driven
 * the way `e2e/screenshots.e2e.ts` drives it (same viewport height, full page, settled page).
 * The e2e suite's own tree stays flat and gitignored; this one is the evidence a PR carries.
 */
import { mkdir } from "node:fs/promises"
import { dirname, join } from "node:path"
import { chromium, type Page } from "@playwright/test"
import { waitForSettledPage } from "../e2e/docs-portal"
import { TEST_VIEWPORT_HEIGHT_PX, TEST_WIDTHS_PX } from "../e2e/viewports"

/** The port this script serves the built site on; not the e2e suite's, so both can run at once. */
const PORT = 8788

const BASE_URL = `http://127.0.0.1:${PORT}`

/** Fumadocs' copy control on a code block: the "Copy Text" button in the block's figure. */
const COPY_CONTROL = "#nd-page figure button[aria-live='polite']"

/** The pages the curated set shows, each under the file name it is committed as. */
const PAGES: readonly CuratedPage[] = [
	{ path: "/docs/", name: "landing-page", widthsPx: TEST_WIDTHS_PX, hover: null },
	{ path: "/docs/no-such-page/", name: "not-found", widthsPx: TEST_WIDTHS_PX, hover: null },
	{ path: "/docs/cli/", name: "cli", widthsPx: TEST_WIDTHS_PX, hover: null },
	{
		path: "/docs/cli/commands/tx/",
		name: "cli-commands-tx",
		widthsPx: TEST_WIDTHS_PX,
		hover: null,
	},
	// The copy control's hover state, which the plain grid never reaches.
	{ path: "/docs/cli/", name: "cli-hover", widthsPx: [1280], hover: COPY_CONTROL },
]

/** A page the curated set shows, the widths it is shown at, and any hover state it needs. */
interface CuratedPage {
	readonly path: string
	readonly name: string
	readonly widthsPx: readonly number[]
	readonly hover: string | null
}

/** One committed screenshot: the theme, width and page it shows, and the file it lands in. */
export interface CuratedShot {
	readonly theme: "light" | "dark"
	readonly widthPx: number
	readonly path: string
	readonly hover: string | null
	readonly file: string
}

/** Every curated screenshot, as `docs/screenshots/<theme>/<width>/<page>.png`. */
export function curatedShots(root = "docs/screenshots"): CuratedShot[] {
	const themes = ["light", "dark"] as const
	return themes.flatMap((theme) =>
		PAGES.flatMap((page) =>
			page.widthsPx.map((widthPx) => ({
				theme,
				widthPx,
				path: page.path,
				hover: page.hover,
				file: join(root, theme, String(widthPx), `${page.name}.png`),
			})),
		),
	)
}

/** Capture one shot from a page already opening the built site. */
async function capture(page: Page, shot: CuratedShot): Promise<void> {
	await page.setViewportSize({ width: shot.widthPx, height: TEST_VIEWPORT_HEIGHT_PX })
	// next-themes follows the system scheme until a reader picks one, so this is the theme.
	await page.emulateMedia({ colorScheme: shot.theme })
	await page.goto(`${BASE_URL}${shot.path}`)
	await waitForSettledPage(page)
	if (shot.hover !== null) {
		await page.hover(shot.hover)
	}
	await mkdir(dirname(shot.file), { recursive: true })
	await page.screenshot({ path: shot.file, fullPage: true })
}

/** Serve the built site the way the e2e suite does, returning a stop function. */
async function serve(): Promise<() => void> {
	const server = Bun.spawn(
		["bunx", "wrangler", "dev", "--ip", "127.0.0.1", "--port", String(PORT)],
		{ stdout: "ignore", stderr: "ignore" },
	)
	await waitForServer()
	return () => server.kill()
}

/** Poll until the served site answers, or give up after two minutes. */
async function waitForServer(): Promise<void> {
	for (let attempt = 0; attempt < 240; attempt += 1) {
		const answer = await fetch(`${BASE_URL}/docs/cli/`).catch(() => null)
		if (answer?.ok === true) {
			return
		}
		await Bun.sleep(500)
	}
	throw new Error(`screenshots: nothing answered on ${BASE_URL}. Run \`bun run build\` first.`)
}

/** Capture every curated screenshot into `docs/screenshots/`. */
async function main(): Promise<void> {
	const shots = curatedShots()
	const stopServing = await serve()
	const browser = await chromium.launch()
	try {
		const page = await browser.newPage()
		for (const shot of shots) {
			await capture(page, shot)
			console.log(`screenshots: ${shot.file}`)
		}
	} finally {
		await browser.close()
		stopServing()
	}
	console.log(`screenshots: ${shots.length} written`)
}

if (import.meta.main) {
	await main()
}
