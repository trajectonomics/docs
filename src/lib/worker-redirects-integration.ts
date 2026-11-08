import { mkdir, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import type { AstroIntegration } from "astro"
import { renderWorkerRedirects } from "./worker-redirects"

/**
 * Writes `_redirects` into the Worker assets directory (the parent of the Astro
 * `outDir`, which is `dist/docs`) after each build, so it sits at the assets root.
 */
export function workerRedirects(): AstroIntegration {
	return {
		name: "worker-redirects",
		hooks: {
			"astro:build:done": async ({ dir }) => {
				const assetsRoot = new URL("../", dir)
				await mkdir(assetsRoot, { recursive: true })
				await writeFile(fileURLToPath(new URL("_redirects", assetsRoot)), renderWorkerRedirects())
			},
		},
	}
}
