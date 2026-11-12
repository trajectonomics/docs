import { describe, expect, test } from "bun:test"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { removeStaleRedirects } from "./stale-redirects"

async function assetsRoot(): Promise<string> {
	return mkdtemp(join(tmpdir(), "stale-redirects-"))
}

describe("the stale redirect rules of an earlier build", () => {
	test("a _redirects file left in the assets root is removed", async () => {
		const root = await assetsRoot()
		try {
			await writeFile(join(root, "_redirects"), "/docs /docs/cli/ 302\n")

			await removeStaleRedirects(root)

			expect(await Bun.file(join(root, "_redirects")).exists()).toBe(false)
		} finally {
			await rm(root, { recursive: true })
		}
	})

	test("an assets root with no _redirects file is left as it is", async () => {
		const root = await assetsRoot()
		try {
			await writeFile(join(root, "kept.txt"), "kept")

			await removeStaleRedirects(root)

			expect(await readFile(join(root, "kept.txt"), "utf8")).toBe("kept")
		} finally {
			await rm(root, { recursive: true })
		}
	})

	test("an assets root that does not exist is not an error", async () => {
		const root = await assetsRoot()
		await rm(root, { recursive: true })

		await removeStaleRedirects(root)
	})
})
