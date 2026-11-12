import { rm } from "node:fs/promises"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import type { AstroIntegration } from "astro"

/** The deletion of a `_redirects` file left in the Worker's assets root by an earlier build. */
export async function removeStaleRedirects(assetsRoot: string): Promise<void> {
	await rm(join(assetsRoot, "_redirects"), { force: true })
}

// Astro empties its `outDir` (`dist/docs`) but not the assets root above it, and a stale
// `_redirects` rule would send `/docs` away from the Landing Page.
/** The Astro integration that runs {@link removeStaleRedirects} after every build. */
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
