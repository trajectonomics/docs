import { renderWorkerRedirects } from "../worker-redirects"
import type { BuiltFile } from "./built-files"
import { fileAt } from "./built-files"
import type { BuildFailure } from "./failures"
import { buildFailure } from "./failures"

/** Path of the Worker's redirect rules in the build output, one segment below the assets root. */
export const REDIRECTS_FILE = "_redirects"

/** Failures for redirect rules the build did not produce, or produced differently from the Worker. */
export function checkRedirects(files: readonly BuiltFile[]): readonly BuildFailure[] {
	const file = fileAt(files, REDIRECTS_FILE)
	if (file === undefined) {
		return [
			buildFailure(
				"REDIRECT_RULES_MISSING",
				REDIRECTS_FILE,
				"the build did not produce the redirect rules",
			),
		]
	}
	if (file.content !== renderWorkerRedirects()) {
		return [
			buildFailure(
				"REDIRECT_RULES_MISMATCH",
				REDIRECTS_FILE,
				"the built redirect rules differ from the Worker's",
			),
		]
	}
	return []
}
