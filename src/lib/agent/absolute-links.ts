/** A Markdown link whose target is a site path under the Docs Portal base, its title kept. */
const MARKDOWN_LINK = /(\]\(\s*)(\/docs(?:\/[^)\s]*)?)/g

/** `content` with every Markdown link under `/docs` rewritten to its absolute URL; other links are untouched. */
export function absoluteDocsLinks(content: string, origin: string): string {
	return content.replace(
		MARKDOWN_LINK,
		(_match, prefix: string, path: string) => `${prefix}${origin}${path}`,
	)
}
