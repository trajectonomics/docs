/** The Portal's origin, from the site the build is configured with; a twin's links are read away from it. */
export function portalOrigin(site: URL | undefined): string {
	if (site === undefined) {
		throw new Error("astro.config.ts has no site, so the Markdown twins have no absolute origin")
	}
	return site.origin
}
