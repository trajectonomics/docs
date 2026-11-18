import { PageRefusalError } from "./refusal"

/** The ways the build cannot name the origin its twins' absolute links need; one value per rule. */
export type PortalOriginErrorCode = "SITE_MISSING"

/** A build whose `astro.config.ts` declares no site, so a twin's links cannot be made absolute. */
export class PortalOriginError extends PageRefusalError<PortalOriginErrorCode> {
	constructor(code: PortalOriginErrorCode, message: string, field: string) {
		super(code, message, field)
		this.name = "PortalOriginError"
		Object.freeze(this)
	}
}

/** The Portal's origin, from the site the build is configured with, for links read off the site. */
export function portalOrigin(site: URL | undefined): string {
	if (site === undefined) {
		throw new PortalOriginError(
			"SITE_MISSING",
			"astro.config.ts has no site, so the Markdown twins have no absolute origin",
			"site",
		)
	}
	return site.origin
}
