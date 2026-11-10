import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, type Page } from "@playwright/test"
import { DOCS_BASE_PATH } from "../src/lib/tabs"

const DOCS_ROOT = fileURLToPath(new URL("../dist/docs/", import.meta.url))

/** A path a reader reaches when nothing is there; the 404 page answers it. */
export const NOT_FOUND_PATH = `${DOCS_BASE_PATH}/no-such-page/`

/** URL paths of every HTML page the build produces, in a stable order. */
export function builtPages(): string[] {
	if (!existsSync(DOCS_ROOT)) {
		throw new Error("The built site is missing. Run `bun run build` before the browser tests.")
	}
	const pages = readdirSync(DOCS_ROOT, { recursive: true, encoding: "utf8" })
		.filter((file) => file.endsWith("index.html"))
		// A page whose whole body is a meta refresh is a redirect stub, not a page.
		.filter((file) => !readFileSync(join(DOCS_ROOT, file), "utf8").includes('http-equiv="refresh"'))
		.map((file) => {
			const slug = file.slice(0, -"index.html".length).replace(/\/$/, "")
			return slug.length === 0 ? `${DOCS_BASE_PATH}/` : `${DOCS_BASE_PATH}/${slug}/`
		})
	if (pages.length === 0) {
		throw new Error("The built site has no pages. Run `bun run build` before the browser tests.")
	}
	return pages.sort()
}

/** The pages a reader can open, plus the Docs Portal 404 page. */
export function pagesUnderTest(): string[] {
	return [...builtPages(), NOT_FOUND_PATH]
}

/** A filesystem-safe name for a page's URL, used for screenshot files. */
export function pageName(path: string): string {
	const slug = path.replace(DOCS_BASE_PATH, "").replace(/^\/|\/$/g, "")
	return slug.length === 0 ? "landing-page" : slug.replace(/\//g, "-")
}

/** Open a page and assert the Docs Portal serves it with the status that page should have. */
export async function openPage(page: Page, path: string): Promise<void> {
	const response = await page.goto(path)
	expect(response?.status(), `${pageName(path)} is served`).toBe(
		path === NOT_FOUND_PATH ? 404 : 200,
	)
}
