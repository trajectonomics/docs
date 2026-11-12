import { rm } from "node:fs/promises"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import type { AstroIntegration } from "astro"

/** Remove the `_redirects` file an earlier build wrote into the Worker's assets root. */
export async function removeStaleRedirects(assetsRoot: string): Promise<void> {
	await rm(join(assetsRoot, "_redirects"), { force: true })
}

/**
 * Removes the `_redirects` an earlier build left behind: Astro empties its `outDir`
 * (`dist/docs`) but not the assets root above it, and a stale rule would send `/docs`
 * away from the Landing Page.
 */
export function staleRedirects(): AstroIntegration {
	return {
		name: "stale-redirects",
		hooks: {
			"astro:build:done": async ({ dir }) => {
				await removeStaleRedirects(fileURLToPath(new URL("../", dir)))
			},
		},
	}
}
