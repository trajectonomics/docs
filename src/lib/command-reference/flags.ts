import type { CommandReferenceProblem, CommandReferenceRule } from "./types"

/** A frozen problem, so a caller cannot edit a rule's verdict. */
export function problem(
	rule: CommandReferenceRule,
	file: string,
	leaf: string,
	flag: string,
	detail: string,
): CommandReferenceProblem {
	return Object.freeze({ rule, file, leaf, flag, detail })
}

/** The flags the release has that a page section does not document. */
export function missingFlags(
	file: string,
	leaf: string,
	documented: readonly string[],
	required: readonly string[],
	version: string,
): readonly CommandReferenceProblem[] {
	const documentedSet = new Set(documented)
	return required
		.filter((flag) => !documentedSet.has(flag))
		.map((flag) =>
			problem(
				"flag-missing",
				file,
				leaf,
				flag,
				`${leaf} is missing ${flag} (traj ${version} accepts it)`,
			),
		)
}

/** The flags a page section documents that the release does not accept. */
export function unknownFlags(
	file: string,
	leaf: string,
	documented: readonly string[],
	allowed: ReadonlySet<string>,
	version: string,
): readonly CommandReferenceProblem[] {
	return documented
		.filter((flag) => !allowed.has(flag))
		.map((flag) =>
			problem(
				"flag-unknown",
				file,
				leaf,
				flag,
				`${leaf} documents ${flag}, but traj ${version} rejects it`,
			),
		)
}

/** Both flag rules over one documented section: what the release has, and what the page names. */
export function flagProblems(
	file: string,
	leaf: string,
	documented: readonly string[],
	required: readonly string[],
	allowed: ReadonlySet<string>,
	version: string,
): readonly CommandReferenceProblem[] {
	return [
		...missingFlags(file, leaf, documented, required, version),
		...unknownFlags(file, leaf, documented, allowed, version),
	]
}
