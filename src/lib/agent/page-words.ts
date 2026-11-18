import type { DocsIndexPage } from "./docs-index"

/** A content page as the build's source exposes it: its URL, and the frontmatter words a page must carry. */
export interface SourcePageWords {
	readonly url: string
	readonly data: {
		readonly title?: string | undefined
		readonly description?: string | undefined
	}
}

/** A page's authored words, as its Markdown twin and its Docs index entry carry them. */
export function pageWords(page: SourcePageWords): DocsIndexPage {
	const title = page.data.title
	if (title === undefined) {
		throw new Error(
			`${page.url} has no frontmatter title, so it has no Markdown twin or Docs index entry`,
		)
	}
	return { title, description: page.data.description, url: page.url }
}
