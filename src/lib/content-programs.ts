import type { ContentFile } from "./content-pages"

/** A fence line: the character that opens it, how many of that character, and its info string. */
interface Fence {
	readonly marker: "`" | "~"
	readonly length: number
	readonly info: string
}

/** The fence languages whose blocks are TypeScript programs a reader can run. */
const TYPESCRIPT_LANGUAGES: ReadonlySet<string> = new Set(["ts", "typescript"])

function fenceOf(line: string): Fence | undefined {
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

function isClosingFence(line: Fence, open: Fence): boolean {
	return line.info === "" && line.marker === open.marker && line.length >= open.length
}

function isTypeScript(info: string): boolean {
	const [language = ""] = info.split(/\s+/)
	return TYPESCRIPT_LANGUAGES.has(language.toLowerCase())
}

/** Every TypeScript fenced program in one content file, in source order. */
export function typescriptPrograms(file: ContentFile): readonly string[] {
	const programs: string[][] = []
	let open: Fence | undefined
	let lines: string[] = []
	for (const line of file.content.split("\n")) {
		const fence = fenceOf(line)
		if (open === undefined) {
			open = fence
			continue
		}
		if (fence === undefined || !isClosingFence(fence, open)) {
			lines.push(line)
			continue
		}
		if (isTypeScript(open.info)) {
			programs.push(lines)
		}
		open = undefined
		lines = []
	}
	return programs.map((program) => program.join("\n"))
}
