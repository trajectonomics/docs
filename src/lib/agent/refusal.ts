/**
 * A refusal the build turns into an error: the rule's code and the caller's input field. A subclass
 * names itself and freezes the result, because Astro annotates a thrown error in place.
 */
export class PageRefusalError<Code extends string> extends Error {
	readonly code: Code
	readonly field: string

	constructor(code: Code, message: string, field: string) {
		super(message)
		this.code = code
		this.field = field
	}
}
