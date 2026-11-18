/** A frozen refusal of a page's authored source: the rule's code and the caller's input field, made immutable. */
export class PageRefusalError<Code extends string> extends Error {
	readonly code: Code
	readonly field: string

	constructor(name: string, code: Code, message: string, field: string) {
		super(message)
		this.name = name
		this.code = code
		this.field = field
		Object.freeze(this)
	}
}
