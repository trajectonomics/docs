/** One authored page's text scoped to a `## ` section, and the JSON samples printed inside it. */

/** `content` between the `## ` heading `heading` and the next one, or `undefined` when it is gone. */
export function sectionContent(content: string, heading: string): string | undefined {
	const start = content.indexOf(`\n${heading}\n`)
	if (start < 0) return undefined
	const end = content.indexOf("\n## ", start + heading.length + 1)
	return end < 0 ? content.slice(start) : content.slice(start, end)
}

/** The first `json` block in `content` carrying the `asOf` and `rows` every sample prints. */
export function jsonSample(content: string): Record<string, unknown> | undefined {
	for (const match of content.matchAll(/^```json\n([\s\S]*?)^```$/gm)) {
		try {
			const parsed: unknown = JSON.parse(match[1] ?? "")
			if (typeof parsed !== "object" || parsed === null) continue
			const { asOf, rows } = parsed as Record<string, unknown>
			if (typeof asOf === "string" && Array.isArray(rows)) return parsed as Record<string, unknown>
		} catch {
			// A `json` block that does not parse is not a sample, so keep looking.
		}
	}
	return undefined
}
