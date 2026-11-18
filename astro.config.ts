import fumadocs from "@fumadocs/astro"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "astro/config"
import { restoreCodeFences } from "./src/lib/code-fences"
import { staleRedirects } from "./src/lib/stale-redirects"
import { TAB_ALIASES, tabUrl } from "./src/lib/tabs"

// The Docs Portal is served under /docs. Workers Static Assets resolves files by
// request path, so the build lands in dist/docs and the Worker serves ./dist.
export default defineConfig({
	site: "https://trajectonomics.com",
	base: "/docs",
	output: "static",
	outDir: "./dist/docs",
	trailingSlash: "always",
	// The audience names in the Landing Page's entries are URLs a reader may type: /docs/operators/
	// and /docs/builders/ reach the Tab they name instead of the 404 page (docs#113).
	redirects: Object.fromEntries(TAB_ALIASES.map((alias) => [alias.path, tabUrl(alias.tab)])),
	integrations: [
		fumadocs({
			collections: {
				docs: {
					dir: "src/content/docs",
					// The MDX components render fences as Fumadocs code blocks (copy control,
					// scroll container); they also need the fence shape src/lib/code-fences.ts restores.
					components: "./src/components/mdx.tsx",
					hastPlugins: (plugins) => [restoreCodeFences(), ...plugins],
					// GitHub's current dark palette, not the older `github-dark` Fumadocs defaults to:
					// that theme's comment colour (#6A737D) fails WCAG AA on the dark code surface
					// (#171717, 3.7:1), and the accessibility suite fails every page with a fence.
					// The light palette stays the default; replace this once the design system owns
					// syntax colours (docs#89).
					rehypeCodeOptions: {
						themes: { light: "github-light", dark: "github-dark-default" },
					},
				},
			},
		}),
		staleRedirects(),
	],
	vite: { plugins: [tailwindcss()] },
})
