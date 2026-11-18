import type { DocsIndexPage } from "./docs-index"
import { PageRefusalError } from "./refusal"

/** The ways a content page cannot give its authored words; one value per rule. */
export type PageWordsErrorCode = "TITLE_MISSING"

/** A page whose frontmatter carries no title, so it has no Markdown twin or Docs index entry. */
export class PageWordsError extends PageRefusalError<PageWordsErrorCode> {
	constructor(code: PageWordsErrorCode, message: string, field: string) {
		super(code, message, field)
		this.name = "PageWordsError"
		Object.freeze(this)
	}
}

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
		throw new PageWordsError(
			"TITLE_MISSING",
			`${page.url} has no frontmatter title, so it has no Markdown twin or Docs index entry`,
			"data.title",
		)
	}
	return Object.freeze({ title, description: page.data.description, url: page.url })
}
