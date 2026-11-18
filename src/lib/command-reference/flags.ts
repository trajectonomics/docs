import type { CommandReferenceProblem, CommandReferenceRule } from "./types"

/** The page, leaf and release a flag rule reports against. */
export interface FlagScope {
	readonly file: string
	readonly leaf: string
	readonly version: string
}

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
	scope: FlagScope,
	documented: readonly string[],
	required: readonly string[],
): readonly CommandReferenceProblem[] {
	const documentedSet = new Set(documented)
	return required
		.filter((flag) => !documentedSet.has(flag))
		.map((flag) =>
			problem(
				"flag-missing",
				scope.file,
				scope.leaf,
				flag,
				`${scope.leaf} is missing ${flag} (traj ${scope.version} accepts it)`,
			),
		)
}

/** The flags a page section documents that the release does not accept. */
export function unknownFlags(
	scope: FlagScope,
	documented: readonly string[],
	allowed: ReadonlySet<string>,
): readonly CommandReferenceProblem[] {
	return documented
		.filter((flag) => !allowed.has(flag))
		.map((flag) =>
			problem(
				"flag-unknown",
				scope.file,
				scope.leaf,
				flag,
				`${scope.leaf} documents ${flag}, but traj ${scope.version} rejects it`,
			),
		)
}

/** Both flag rules over one documented section: what the release has, and what the page names. */
export function flagProblems(
	scope: FlagScope,
	documented: readonly string[],
	required: readonly string[],
	allowed: ReadonlySet<string>,
): readonly CommandReferenceProblem[] {
	return Object.freeze([
		...missingFlags(scope, documented, required),
		...unknownFlags(scope, documented, allowed),
	])
}
