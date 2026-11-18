import { absoluteDocsLinks } from "./absolute-links"
import { shownDescription } from "./description"
import { PageRefusalError } from "./refusal"

/** The ways an authored page cannot produce a faithful Markdown twin; one value per rule. */
export type MarkdownTwinErrorCode = "JSX_BODY"

/** A page whose authored body carries content no Markdown twin can hold. */
export class MarkdownTwinError extends PageRefusalError<MarkdownTwinErrorCode> {
	constructor(code: MarkdownTwinErrorCode, message: string, field: string) {
		super(code, message, field)
		this.name = "MarkdownTwinError"
		Object.freeze(this)
	}
}

/** The authored words of one page: its frontmatter title and description, and its body without frontmatter. */
export interface PageTwinSource {
	readonly title: string
	readonly description?: string | undefined
	readonly body: string
}

/** Fenced code: an opening fence, its lines, and a closing fence, which the twin keeps as body text. */
const FENCED_CODE = /^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^(`{3,}|~{3,})\s*$/gm

/** Inline code: a backtick span, which quotes an angle bracket instead of rendering an element. */
const INLINE_CODE = /`[^`\n]*`/g

/** A JSX element or HTML tag in an MDX body, such as `<Callout>`, `<br />` or `</div>`. */
const JSX_ELEMENT = /<\/?[A-Za-z][A-Za-z0-9.]*(?:\s[^<>]*)?\/?>/

/** Whether an MDX body renders a JSX element, which no Markdown twin can carry. */
function carriesJsx(body: string): boolean {
	return JSX_ELEMENT.test(body.replace(FENCED_CODE, "").replace(INLINE_CODE, ""))
}

/** The Markdown twin of a page: its title, its description, then its body with links made absolute. */
export function buildMarkdownTwin(page: PageTwinSource, origin: string): string {
	if (carriesJsx(page.body)) {
		throw new MarkdownTwinError(
			"JSX_BODY",
			`${page.title} has a JSX body, so its Markdown twin would drop content`,
			"body",
		)
	}
	const description = shownDescription(page.description)
	const described = description === undefined ? [] : [`> ${description}`, ""]
	return [
		`# ${page.title}`,
		"",
		...described,
		absoluteDocsLinks(page.body.trim(), origin),
		"",
	].join("\n")
}
