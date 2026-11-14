/** A JSON string, a `//` line comment, or a block comment; string matches are kept, comments dropped. */
const JSONC_COMMENT = /("(?:\\.|[^"\\])*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g

/**
 * Remove JSONC comments, keeping strings intact, so a strict JSON parser can read the text. A
 * `//` inside a string is part of that string, not a comment.
 */
export function stripJsoncComments(text: string): string {
	return text.replace(JSONC_COMMENT, (_match, string: string | undefined) => string ?? "")
}
