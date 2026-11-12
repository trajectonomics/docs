import type { BuiltFile } from "./built-files"
import type { BuildFailure } from "./failures"
import { buildFailure } from "./failures"

/** The sentence the Tab pages carried before they had content; no built page may show it again. */
export const PLACEHOLDER_SENTENCE = "This page is a placeholder"

/** Failures for built pages that still show the placeholder sentence instead of content. */
export function checkPlaceholderCopy(files: readonly BuiltFile[]): readonly BuildFailure[] {
	return files
		.filter((file) => file.path.endsWith(".html") && file.content.includes(PLACEHOLDER_SENTENCE))
		.map((file) =>
			buildFailure(
				"PLACEHOLDER_COPY_PRESENT",
				file.path,
				`the page still shows "${PLACEHOLDER_SENTENCE}"`,
			),
		)
}
