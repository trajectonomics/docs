import type { ContentFile } from "./content-pages"

/** One fenced code block a page publishes: its language and the text between its fences. */
export interface CodeFence {
	readonly language: string
	readonly body: string
}

/** A fence line: the character that opens it, how many of that character, and its info string. */
interface FenceLine {
	readonly marker: "`" | "~"
	readonly length: number
	readonly info: string
}

/** The fence languages whose blocks are TypeScript programs a reader can run. */
const TYPESCRIPT_LANGUAGES: ReadonlySet<string> = new Set(["ts", "typescript"])

function fenceOf(line: string): FenceLine | undefined {
	const match = /^\s*(`{3,}|~{3,})(.*)$/.exec(line)
	const spec = match?.[1]
	if (spec === undefined) {
		return undefined
	}
	return {
		marker: spec.startsWith("`") ? "`" : "~",
		length: spec.length,
		info: (match?.[2] ?? "").trim(),
	}
}

function isClosingFence(line: FenceLine, open: FenceLine): boolean {
	return line.info === "" && line.marker === open.marker && line.length >= open.length
}

/** The language on an info string, without the options that may follow it. */
function languageOf(info: string): string {
	const [language = ""] = info.split(/\s+/)
	return language.toLowerCase()
}

/** Every fenced code block in `content`, in source order. A fence never closed is not a block. */
export function codeFences(content: string): readonly CodeFence[] {
	const fences: CodeFence[] = []
	let open: FenceLine | undefined
	let lines: string[] = []
	for (const line of content.split("\n")) {
		const fence = fenceOf(line)
		if (open === undefined) {
			open = fence
			continue
		}
		if (fence === undefined || !isClosingFence(fence, open)) {
			lines.push(line)
			continue
		}
		fences.push({ language: languageOf(open.info), body: lines.join("\n") })
		open = undefined
		lines = []
	}
	return fences
}

/** Every TypeScript fenced program in one content file, in source order. */
export function typescriptPrograms(file: ContentFile): readonly string[] {
	return codeFences(file.content)
		.filter((fence) => TYPESCRIPT_LANGUAGES.has(fence.language))
		.map((fence) => fence.body)
}
