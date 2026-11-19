import { SITE_ORIGIN } from "../site"

/** The URL path a link or URL names on the Portal, or `undefined` when it points off it. */
export function sitePath(value: string): string | undefined {
	try {
		const url = new URL(value, SITE_ORIGIN)
		return url.origin === SITE_ORIGIN ? decodeURIComponent(url.pathname) : undefined
	} catch {
		return undefined
	}
}
