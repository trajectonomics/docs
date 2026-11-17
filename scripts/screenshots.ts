/*
 * Render the curated screenshots `docs/design/portal-shell.md` requires and commits under
 * `docs/screenshots/`: the built Docs Portal at 1280, 2000 and 390px in light and dark, driven
 * the way `e2e/screenshots.e2e.ts` drives it (same viewport height, full page, settled page).
 * The e2e suite's own tree stays flat and gitignored; this one is the evidence a PR carries.
 *
 * Both sets stay while the Docs Portal exposes one Theme (docs#89): the set captured with the
 * device set to light renders the same dark look, so light's return needs no new evidence.
 */
import { mkdir } from "node:fs/promises"
import { dirname } from "node:path"
import { chromium, type Page } from "@playwright/test"
import { waitForSettledPage } from "../e2e/docs-portal"
import { TEST_VIEWPORT_HEIGHT_PX } from "../e2e/viewports"
import { type CuratedShot, curatedShots } from "./screenshot-pages"

/** The port this script serves the built site on; not the e2e suite's, so both can run at once. */
const PORT = 8788

const BASE_URL = `http://127.0.0.1:${PORT}`

/** Wait until no transition or animation is still running, so a shot shows the settled state. */
async function waitForAnimations(page: Page): Promise<void> {
	await page.waitForFunction(() =>
		document.getAnimations().every((animation) => animation.playState !== "running"),
	)
}

/** Capture one shot from a page already opening the built site. */
async function capture(page: Page, shot: CuratedShot): Promise<void> {
	await page.setViewportSize({ width: shot.widthPx, height: TEST_VIEWPORT_HEIGHT_PX })
	// The shell forces the dark Theme, so the light set renders the same dark look; the device
	// scheme is still emulated, because it is what a reader on that device actually brings.
	await page.emulateMedia({ colorScheme: shot.theme })
	await page.goto(`${BASE_URL}${shot.path}`)
	await waitForSettledPage(page)
	if (shot.drive !== null) {
		await shot.drive(page)
		await waitForAnimations(page)
	}
	await mkdir(dirname(shot.file), { recursive: true })
	await page.screenshot({ path: shot.file, fullPage: shot.fullPage })
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
