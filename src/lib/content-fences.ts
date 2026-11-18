/** One fenced code block in a page: the language on its info string and its body. */
export interface CodeFence {
	readonly language: string
	readonly body: string
}

/** An opening fence alone on its line, and the next line that closes it. */
const FENCE = /^```([^\n`]*)\n([\s\S]*?)^```[ \t]*$/gm

/** Every fenced code block in `content`, in source order. */
export function codeFences(content: string): readonly CodeFence[] {
	return [...content.matchAll(FENCE)].map((match) => ({
		language: (match[1] ?? "").trim().split(/\s+/)[0]?.toLowerCase() ?? "",
		body: match[2] ?? "",
	}))
}
