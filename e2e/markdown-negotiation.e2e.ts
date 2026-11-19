import { readdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { expect, test } from "./fixtures"

// The Worker answers `Accept: text/markdown` with the page's twin and forwards everything else to
// the assets (ADR 0010), so the redirect, the aliases, the 404 page and the assets keep their
// answers. `wrangler dev` serves the built site, which is the production seam (ADR 0004).
const PAGE = "/docs/cli/commands/tx/"
const TWIN = "/docs/cli/commands/tx.md"
const DOCS_ROOT = fileURLToPath(new URL("../dist/docs/", import.meta.url))

/** A built asset's URL path, to check that a stylesheet still passes through untouched. */
function firstAssetPath(): string {
	const asset = readdirSync(`${DOCS_ROOT}_astro`).find((file) => file.endsWith(".css"))
	if (asset === undefined) throw new Error("the built site has no stylesheet")
	return `/docs/_astro/${asset}`
}

test("a page asked for as Markdown answers its twin, typed and varied", async ({ request }) => {
	const response = await request.get(PAGE, { headers: { Accept: "text/markdown" } })

	expect(response.status()).toBe(200)
	expect(response.headers()["content-type"]).toBe("text/markdown; charset=utf-8")
	expect(response.headers()["vary"]?.toLowerCase()).toContain("accept")
	const served = await response.text()
	expect(served.startsWith("# ")).toBe(true)
	expect(served).toBe(await (await request.get(TWIN)).text())
})

for (const accept of ["text/html", "*/*", "text/*"]) {
	test(`a page with Accept: ${accept} answers the HTML page, varied`, async ({ request }) => {
		const response = await request.get(PAGE, { headers: { Accept: accept } })

		expect(response.status()).toBe(200)
		expect(response.headers()["content-type"]).toBe("text/html; charset=utf-8")
		expect(response.headers()["vary"]?.toLowerCase()).toContain("accept")
		expect(await response.text()).toContain("<h1")
	})
}

test("a page with no Accept header answers the HTML page, varied", async ({ request }) => {
	const response = await request.get(PAGE)

	expect(response.headers()["content-type"]).toBe("text/html; charset=utf-8")
	expect(response.headers()["vary"]?.toLowerCase()).toContain("accept")
})

test("a q of zero refuses Markdown and a q of 0.5 asks for it", async ({ request }) => {
	const refused = await request.get(PAGE, { headers: { Accept: "text/markdown;q=0" } })
	const asked = await request.get(PAGE, { headers: { Accept: "text/markdown;q=0.5" } })

	expect(refused.headers()["content-type"]).toBe("text/html; charset=utf-8")
	expect(asked.headers()["content-type"]).toBe("text/markdown; charset=utf-8")
})

test("a HEAD request answers the negotiated content type", async ({ request }) => {
	const response = await request.head(PAGE, { headers: { Accept: "text/markdown" } })

	expect(response.status()).toBe(200)
	expect(response.headers()["content-type"]).toBe("text/markdown; charset=utf-8")
})

test("a twin URL and the Docs index are served unchanged", async ({ request }) => {
	const twin = await request.get(TWIN, { headers: { Accept: "text/markdown" } })
	const index = await request.get("/docs/llms.txt")

	expect(twin.status()).toBe(200)
	expect(twin.headers()["content-type"]).toBe("text/markdown; charset=utf-8")
	expect(twin.headers()["vary"]).toBeUndefined()
	expect(index.status()).toBe(200)
	expect(index.headers()["content-type"]).toBe("text/plain; charset=utf-8")
})

test("an asset passes through untouched", async ({ request }) => {
	const response = await request.get(firstAssetPath(), { headers: { Accept: "text/markdown" } })

	expect(response.status()).toBe(200)
	expect(response.headers()["content-type"]).toBe("text/css; charset=utf-8")
})

test("/docs still redirects to /docs/", async ({ request }) => {
	const response = await request.get("/docs", {
		headers: { Accept: "text/markdown" },
		maxRedirects: 0,
	})

	expect(response.status()).toBe(307)
	expect(response.headers()["location"]).toBe("/docs/")
})

test("an audience alias still reaches its Tab", async ({ request }) => {
	const redirect = await request.get("/docs/operators", {
		headers: { Accept: "text/markdown" },
		maxRedirects: 0,
	})
	const alias = await request.get("/docs/operators/", { headers: { Accept: "text/markdown" } })

	expect(redirect.status()).toBe(307)
	expect(redirect.headers()["location"]).toBe("/docs/operators/")
	expect(alias.status()).toBe(200)
	expect(alias.headers()["content-type"]).toBe("text/html; charset=utf-8")
	expect(await alias.text()).toContain('http-equiv="refresh"')
})

test("a missing page still shows the 404 page", async ({ request }) => {
	const response = await request.get("/docs/no-such-page/", {
		headers: { Accept: "text/markdown" },
	})

	expect(response.status()).toBe(404)
	expect(response.headers()["content-type"]).toBe("text/html; charset=utf-8")
	expect(await response.text()).toContain("Page not found")
})
