/** One `<a>` element of an HTML fragment: the attributes and text the build checks read. */
export interface HtmlAnchor {
	readonly href: string | undefined
	readonly ariaCurrent: string | undefined
	readonly ariaLabel: string | undefined
	readonly text: string
}

const ANCHOR = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi
const TAG = /<[^>]*>/g
const WHITESPACE = /\s+/g
const NAMED_ENTITIES: Readonly<Record<string, string>> = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	nbsp: " ",
}

/** The value of one attribute of a start tag's attribute text, or `undefined` when it has none. */
export function tagAttribute(attributes: string, name: string): string | undefined {
	return new RegExp(`(?:^|\\s)${name}="([^"]*)"`).exec(attributes)?.[1]
}

function decodeEntities(text: string): string {
	return text.replace(/&(#?\w+);/g, (entity, name: string) => NAMED_ENTITIES[name] ?? entity)
}

/** The visible text of an HTML fragment, with its tags and surrounding whitespace gone. */
export function visibleText(html: string): string {
	return decodeEntities(html.replace(TAG, " ")).replace(WHITESPACE, " ").trim()
}

/** The content of the first element carrying `id`, or `undefined` when the fragment has none. */
export function elementContent(html: string, id: string): string | undefined {
	const open = new RegExp(`<([a-zA-Z][\\w-]*)\\b[^>]*\\bid="${id}"[^>]*>`).exec(html)
	if (open === null || open[1] === undefined) return undefined
	const start = open.index + open[0].length
	return contentUntilClose(html, start, open[1])
}

/** The content after `start` up to the close of `tag`, nesting same-named elements. */
function contentUntilClose(html: string, start: number, tag: string): string | undefined {
	const pattern = new RegExp(`<(/?)${tag}\\b[^>]*>`, "gi")
	pattern.lastIndex = start
	let depth = 0
	for (let match = pattern.exec(html); match !== null; match = pattern.exec(html)) {
		if (match[1] === "/") {
			if (depth === 0) return html.slice(start, match.index)
			depth -= 1
		} else if (!match[0].endsWith("/>")) {
			depth += 1
		}
	}
	return undefined
}

/** Every `<a>` element of an HTML fragment, in source order. */
export function anchors(html: string): readonly HtmlAnchor[] {
	return [...html.matchAll(ANCHOR)].map((match) =>
		Object.freeze({
			href: tagAttribute(match[1] ?? "", "href"),
			ariaCurrent: tagAttribute(match[1] ?? "", "aria-current"),
			ariaLabel: tagAttribute(match[1] ?? "", "aria-label"),
			text: visibleText(match[2] ?? ""),
		}),
	)
}

/** The name a link is read aloud with. */
export function linkName(link: HtmlAnchor): string {
	return link.ariaLabel ?? link.text
}
