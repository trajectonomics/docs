/** Whether a built HTML file is a redirect stub the build writes to send a reader to another URL. */
export function isRedirectPage(content: string): boolean {
	return /<meta\b[^>]*http-equiv="refresh"/i.test(content)
}
