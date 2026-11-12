import { TABS, tabUrl } from "../tabs"
import type { BuiltFile } from "./built-files"
import { fileAt } from "./built-files"
import type { BuildFailure } from "./failures"
import { buildFailure } from "./failures"

/** Path of the Worker's redirect rules in the build output, one segment below the assets root. */
export const REDIRECTS_FILE = "_redirects"

/** The Operator tab's URL with and without its trailing slash: the targets `/docs` must not take. */
const OPERATOR_TAB_TARGETS: readonly string[] = [tabUrl(TABS[0]), tabUrl(TABS[0]).slice(0, -1)]

/** The target of a `_redirects` rule line, or `undefined` for a blank line or a comment. */
function ruleTarget(line: string): string | undefined {
	const rule = line.trim()
	return rule === "" || rule.startsWith("#") ? undefined : rule.split(/\s+/)[1]
}

/** Failures for each redirect rule that sends readers to the Operator tab, as `/docs` once did. */
export function checkRedirects(files: readonly BuiltFile[]): readonly BuildFailure[] {
	const file = fileAt(files, REDIRECTS_FILE)
	if (file === undefined) {
		return []
	}
	return file.content
		.split("\n")
		.filter((line) => OPERATOR_TAB_TARGETS.includes(ruleTarget(line) ?? ""))
		.map((line) =>
			buildFailure(
				"REDIRECT_TO_OPERATOR_TAB",
				REDIRECTS_FILE,
				`the redirect rule "${line.trim()}" sends readers to the Operator tab`,
			),
		)
}
