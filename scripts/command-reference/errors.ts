/** One code per way the check refuses to give a verdict; every one exits 2. */
export type CommandReferenceErrorCode =
	| "USAGE_INVALID"
	| "RELEASE_UNREADABLE"
	| "COMMANDS_NOT_LISTED"
	| "LEAF_UNNAMED"
	| "NO_LEAVES_LISTED"
	| "POSITIONALS_UNDESCRIBED"
	| "INPUT_UNDESCRIBED"
	| "GLOBAL_OPTIONS_MISSING"
	| "GLOBAL_OPTIONS_UNREADABLE"
	| "GLOBAL_OPTIONS_EMPTY"
	| "PAGES_UNREADABLE"
	| "BASELINE_UNREADABLE"

/** The one error the check raises to refuse a verdict, so a caller can branch on `code`. */
export class CheckError extends Error {
	readonly code: CommandReferenceErrorCode

	constructor(code: CommandReferenceErrorCode, message: string) {
		super(message)
		this.name = "CheckError"
		this.code = code
		Object.freeze(this)
	}
}
