import { TAB_ALIASES, tabUrl } from "../tabs"
import type { BuiltFile } from "./built-files"
import { fileAt } from "./built-files"
import type { BuildFailure } from "./failures"
import { buildFailure } from "./failures"
import { redirectTarget } from "./redirect-page"

/** Assets-root path of the built stub for an alias path, such as `docs/operators/index.html`. */
export function aliasFile(path: string): string {
	return `docs${path}/index.html`
}

function aliasFailures(
	alias: (typeof TAB_ALIASES)[number],
	file: BuiltFile,
): readonly BuildFailure[] {
	const expected = tabUrl(alias.tab)
	const target = redirectTarget(file.content)
	if (target === expected) {
		return []
	}
	return [
		buildFailure(
			"TAB_ALIAS_TARGET",
			file.path,
			`the alias sends readers to ${target ?? "no page"}, expected ${expected}`,
		),
	]
}

/** Failures for an audience name that does not reach the Tab it names (docs#113). */
export function checkTabAliases(files: readonly BuiltFile[]): readonly BuildFailure[] {
	return TAB_ALIASES.flatMap((alias) => {
		const file = fileAt(files, aliasFile(alias.path))
		if (file === undefined) {
			return [
				buildFailure(
					"TAB_ALIAS_MISSING",
					aliasFile(alias.path),
					`the build did not produce the redirect for ${alias.path}`,
				),
			]
		}
		return aliasFailures(alias, file)
	})
}
