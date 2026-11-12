import type { BuiltFile } from "./built-files"
import { fileAt } from "./built-files"
import type { BuildFailure, BuildFailureCode } from "./failures"
import { buildFailure } from "./failures"

/** A built page whose absence must fail the check, and the code that names it. */
interface RequiredPage {
	readonly path: string
	readonly code: BuildFailureCode
	readonly description: string
}

const REQUIRED_PAGES: readonly RequiredPage[] = [
	{ path: "docs/404.html", code: "NOT_FOUND_PAGE_MISSING", description: "the 404 page" },
	{ path: "docs/index.html", code: "LANDING_PAGE_MISSING", description: "the Landing Page" },
	{
		path: "docs/cli/index.html",
		code: "OPERATOR_TAB_PAGE_MISSING",
		description: "the Operator Tab page",
	},
]

/** Failures for every required page the build did not produce. */
export function checkRequiredPages(files: readonly BuiltFile[]): readonly BuildFailure[] {
	const failures: BuildFailure[] = []
	for (const page of REQUIRED_PAGES) {
		if (fileAt(files, page.path) === undefined) {
			failures.push(
				buildFailure(page.code, page.path, `the build did not produce ${page.description}`),
			)
		}
	}
	return failures
}
