import { twinPath } from "./twin-path"

/** The absolute URL of a page's Markdown twin, from the origin the build serves. */
export function twinUrl(origin: string, pageUrl: string): string {
	return `${origin}${twinPath(pageUrl)}`
}
