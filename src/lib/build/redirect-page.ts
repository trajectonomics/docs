/** The start tag of a meta refresh, when a built file has one. */
const META_REFRESH = /<meta\b[^>]*http-equiv="refresh"[^>]*>/i

/** Whether a built HTML file is a redirect stub the build writes to send a reader to another URL. */
export function isRedirectPage(content: string): boolean {
	return META_REFRESH.test(content)
}

/** The URL a built redirect stub sends the reader to, or `undefined` when it is not one. */
export function redirectTarget(content: string): string | undefined {
	const tag = META_REFRESH.exec(content)?.[0]
	return tag === undefined ? undefined : /content="[^"]*url=([^"]+)"/i.exec(tag)?.[1]
}
