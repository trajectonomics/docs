/** One released CLI leaf: the name the release reports and the flags it accepts. */
export interface ReleaseLeaf {
	readonly name: string
	readonly flags: readonly string[]
}

/** The published CLI release a command reference is compared against. */
export interface ReleaseSnapshot {
	readonly version: string
	readonly leaves: readonly ReleaseLeaf[]
	readonly globalFlags: readonly string[]
}

/** One way a command-reference page can disagree with the release; one code per rule. */
export type CommandReferenceRule =
	| "leaf-page-missing"
	| "leaf-unknown"
	| "flag-missing"
	| "flag-unknown"

/** A command-reference page that disagrees with the release, by rule, page, leaf and flag. */
export interface CommandReferenceProblem {
	readonly rule: CommandReferenceRule
	readonly file: string
	/** The released leaf, or `GLOBAL_LEAF` for the global-options section. */
	readonly leaf: string
	/** The flag the rule is about, or "" when the rule is about a leaf. */
	readonly flag: string
	readonly detail: string
}
