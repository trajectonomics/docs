/** The origin the Docs Portal is deployed to; a twin's links are absolute because it is read away from the site. */
export const PORTAL_ORIGIN = "https://trajectonomics.com"

/** The absolute URL of a site path under the Docs Portal base, such as a Markdown twin's. */
export function portalUrl(path: string): string {
	return `${PORTAL_ORIGIN}${path}`
}
