import fumadocs from "@fumadocs/astro"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import { staleRedirects } from "./src/lib/stale-redirects"

// The Docs Portal is served under /docs. Workers Static Assets resolves files by
// request path, so the build lands in dist/docs and the Worker serves ./dist.
export default defineConfig({
	site: "https://trajectonomics.com",
	base: "/docs",
	output: "static",
	outDir: "./dist/docs",
	trailingSlash: "always",
	integrations: [
		fumadocs({ collections: { docs: { dir: "src/content/docs" } } }),
		staleRedirects(),
	],
	vite: { plugins: [tailwindcss()] },
})
