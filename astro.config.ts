import fumadocs from "@fumadocs/astro"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import { DEFAULT_TAB, tabUrl } from "./src/lib/tabs"
import { workerRedirects } from "./src/lib/worker-redirects-integration"

// The Docs Portal is served under /docs. Workers Static Assets resolves files by
// request path, so the build lands in dist/docs and the Worker serves ./dist.
export default defineConfig({
	site: "https://trajectonomics.com",
	base: "/docs",
	output: "static",
	outDir: "./dist/docs",
	trailingSlash: "always",
	redirects: { "/": tabUrl(DEFAULT_TAB) },
	integrations: [
		fumadocs({ collections: { docs: { dir: "src/content/docs" } } }),
		workerRedirects(),
	],
	vite: { plugins: [tailwindcss()] },
})
