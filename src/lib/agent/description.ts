/** A description as a Markdown twin or a Docs index bullet shows it: `undefined` when frontmatter carries none. */
export function shownDescription(description: string | undefined): string | undefined {
	return description === undefined || description === "" ? undefined : description
}
