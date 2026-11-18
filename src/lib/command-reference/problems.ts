import type { ContentFile } from "../content-pages"
import { globalProblems } from "./globals"
import { leafProblems, unknownLeaves } from "./leaves"
import type { CommandReferenceProblem, ReleaseSnapshot } from "./types"

/** Every place the command reference disagrees with the release; empty when the pages agree. */
export function checkCommandReference(
	release: ReleaseSnapshot,
	files: readonly ContentFile[],
): readonly CommandReferenceProblem[] {
	const released = new Set(release.leaves.map((leaf) => leaf.name))
	return Object.freeze([
		...release.leaves.flatMap((leaf) => leafProblems(release, files, leaf)),
		...unknownLeaves(files, released),
		...globalProblems(release, files),
	])
}

/** The identity a baseline matches on: rule, page, leaf and flag, never the message wording. */
export function problemKey(problem: CommandReferenceProblem): string {
	return [problem.rule, problem.file, problem.leaf, problem.flag].join("\u0000")
}
