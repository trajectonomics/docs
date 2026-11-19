/**
 * The quality an `Accept` media range gives a type: no `q` parameter means 1, and a `q` that is
 * not a number means 0, because a client that cannot say how much it wants it gets nothing.
 */
function quality(range: string): number {
	for (const parameter of range.split(";").slice(1)) {
		const [name, value] = parameter.split("=").map((part) => part.trim())
		if (name?.toLowerCase() !== "q") continue
		const parsed = Number.parseFloat(value ?? "")
		return Number.isNaN(parsed) ? 0 : parsed
	}
	return 1
}

/** Whether an `Accept` header asks for Markdown: a `text/markdown` range with a non-zero quality. */
export function acceptsMarkdown(accept: string | null): boolean {
	if (accept === null) return false
	return accept.split(",").some((range) => {
		const mediaType = range.split(";")[0]?.trim().toLowerCase()
		return mediaType === "text/markdown" && quality(range) > 0
	})
}
