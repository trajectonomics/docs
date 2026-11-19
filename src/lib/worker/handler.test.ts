import { describe, expect, test } from "bun:test"
import { type AssetsBinding, handleRequest } from "./handler"

const TWIN = "# tx\n\nRecord a transaction.\n"
const LANDING_TWIN = "# Trajectonomics Docs\n"
const PAGE = "<!doctype html><h1>tx</h1>"

/** The assets the Worker sees: the built files by path, and the assets' own 404 page. */
function assetsWith(files: Readonly<Record<string, string>>): AssetsBinding {
	return {
		fetch: async (request) => {
			const path = new URL(request.url).pathname
			const file = files[path]
			if (file === undefined) {
				return new Response("Not found", {
					status: 404,
					headers: { "content-type": "text/html; charset=utf-8" },
				})
			}
			const type = path.endsWith(".md") ? "text/markdown" : "text/html; charset=utf-8"
			return new Response(request.method === "HEAD" ? null : file, {
				headers: { "content-type": type },
			})
		},
	}
}

const pages = assetsWith({
	"/docs/": PAGE,
	"/docs/index.md": LANDING_TWIN,
	"/docs/cli/": PAGE,
	"/docs/cli/commands/tx/": PAGE,
	"/docs/cli/commands/tx.md": TWIN,
	"/docs/llms.txt": "# Docs\n",
})

function request(path: string, accept?: string, method = "GET"): Request {
	return new Request(`http://docs.test${path}`, {
		method,
		...(accept === undefined ? {} : { headers: { accept } }),
	})
}

describe("the Worker answers a page with its Markdown twin when asked", () => {
	test("a page asked for as Markdown answers the twin, typed and varied", async () => {
		const response = await handleRequest(request("/docs/cli/commands/tx/", "text/markdown"), pages)

		expect(response.status).toBe(200)
		expect(response.headers.get("content-type")).toBe("text/markdown; charset=utf-8")
		expect(response.headers.get("vary")).toBe("Accept")
		expect(await response.text()).toBe(TWIN)
	})

	test("a page with no Accept header answers the HTML page, still varied", async () => {
		const response = await handleRequest(request("/docs/cli/commands/tx/"), pages)

		expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8")
		expect(response.headers.get("vary")).toBe("Accept")
		expect(await response.text()).toBe(PAGE)
	})

	test("a wildcard Accept keeps the HTML page", async () => {
		for (const accept of ["*/*", "text/*"]) {
			const response = await handleRequest(request("/docs/cli/commands/tx/", accept), pages)
			expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8")
		}
	})

	test("the quality of text/markdown decides: zero refuses, anything above asks", async () => {
		const refused = await handleRequest(
			request("/docs/cli/commands/tx/", "text/markdown;q=0"),
			pages,
		)
		const asked = await handleRequest(
			request("/docs/cli/commands/tx/", "text/markdown;q=0.5"),
			pages,
		)

		expect(refused.headers.get("content-type")).toBe("text/html; charset=utf-8")
		expect(asked.headers.get("content-type")).toBe("text/markdown; charset=utf-8")
	})

	test("a HEAD request answers the negotiated type with no body", async () => {
		const response = await handleRequest(
			request("/docs/cli/commands/tx/", "text/markdown", "HEAD"),
			pages,
		)

		expect(response.headers.get("content-type")).toBe("text/markdown; charset=utf-8")
		expect(response.headers.get("vary")).toBe("Accept")
		expect(await response.text()).toBe("")
	})

	test("the Landing Page negotiates its own twin", async () => {
		const response = await handleRequest(request("/docs/", "text/markdown"), pages)

		expect(response.headers.get("content-type")).toBe("text/markdown; charset=utf-8")
		expect(await response.text()).toBe(LANDING_TWIN)
	})

	test("a twin URL is served unchanged", async () => {
		const response = await handleRequest(request("/docs/cli/commands/tx.md"), pages)

		expect(response.headers.get("content-type")).toBe("text/markdown")
		expect(response.headers.get("vary")).toBeNull()
		expect(await response.text()).toBe(TWIN)
	})

	test("the Docs index is served unchanged", async () => {
		const response = await handleRequest(request("/docs/llms.txt"), pages)

		expect(await response.text()).toBe("# Docs\n")
		expect(response.headers.get("vary")).toBeNull()
	})

	test("a page with no twin keeps today's answer, unvaried", async () => {
		const response = await handleRequest(request("/docs/no-such-page/", "text/markdown"), pages)

		expect(response.status).toBe(404)
		expect(response.headers.get("vary")).toBeNull()
	})

	test("a request that is not a read is forwarded untouched", async () => {
		const response = await handleRequest(request("/docs/cli/", "text/markdown", "POST"), pages)

		expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8")
		expect(response.headers.get("vary")).toBeNull()
	})
})
