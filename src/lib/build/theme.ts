import type { BuiltFile } from "./built-files"
import type { BuildFailure } from "./failures"
import { buildFailure } from "./failures"
import { tagAttribute } from "./html"

/** The one Theme the Docs Portal exposes while the organisation ships one look (docs#89). */
export const DARK_THEME = "dark"

/** The light Theme's class, which no `<html>` may carry while the Theme is forced dark. */
const LIGHT_CLASS = "light"

/** Fumadocs' theme switch marks its control with this attribute. */
const THEME_TOGGLE = /\bdata-theme-toggle\b/

const HTML_TAG = /<html\b([^>]*)>/i

/** The attributes of the document's `<html>` start tag; empty when the page has none. */
function htmlAttributes(content: string): string {
	return HTML_TAG.exec(content)?.[1] ?? ""
}

function classesOf(attributes: string): readonly string[] {
	return (tagAttribute(attributes, "class") ?? "").split(/\s+/).filter((name) => name.length > 0)
}

function pageFailures(page: BuiltFile): readonly BuildFailure[] {
	const attributes = htmlAttributes(page.content)
	const failures: BuildFailure[] = []
	if (tagAttribute(attributes, "data-theme") !== DARK_THEME) {
		failures.push(
			buildFailure(
				"THEME_NOT_DARK",
				page.path,
				`the <html> element does not declare data-theme="${DARK_THEME}"`,
			),
		)
	}
	if (classesOf(attributes).includes(LIGHT_CLASS)) {
		failures.push(
			buildFailure(
				"THEME_LIGHT_CLASS",
				page.path,
				`the <html> element carries the ${LIGHT_CLASS} class`,
			),
		)
	}
	if (THEME_TOGGLE.test(page.content)) {
		failures.push(
			buildFailure("THEME_TOGGLE_PRESENT", page.path, "the page renders a theme toggle"),
		)
	}
	return failures
}

/** Failures for every built page whose `<html>` is not dark or that still offers a theme toggle. */
export function checkTheme(files: readonly BuiltFile[]): readonly BuildFailure[] {
	return files.filter((file) => file.path.endsWith(".html")).flatMap(pageFailures)
}
