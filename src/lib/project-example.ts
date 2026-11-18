/** One `project()` argument that is neither an inline literal nor a value the fence declares. */
export interface UndefinedProjectArgument {
	readonly call: number
	readonly index: number
	readonly source: string
}

const DECLARATION = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g
const CALL = /\bproject\s*\(/g
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/

function isQuote(char: string): boolean {
	return char === '"' || char === "'" || char === "`"
}

function depthChange(char: string): number {
	if (char === "(" || char === "[" || char === "{") return 1
	return char === ")" || char === "]" || char === "}" ? -1 : 0
}

/** The index after the quote closing the string that starts at `start`, or the text's end. */
function closingQuote(text: string, start: number): number {
	const quote = text[start]
	for (let index = start + 1; index < text.length; index += 1) {
		const char = text[index]
		if (char === "\\") index += 1
		else if (char === quote) return index
	}
	return text.length
}

/** The names `program` declares with `const`, `let` or `var`. */
function declaredNames(program: string): ReadonlySet<string> {
	return new Set([...program.matchAll(DECLARATION)].flatMap((match) => match[1] ?? []))
}

/** Where a call's text ends, and the offsets of the commas at its top level. */
interface CallScan {
	readonly close: number | undefined
	readonly commas: readonly number[]
}

function scanCall(program: string, start: number): CallScan {
	const commas: number[] = []
	let depth = 0
	for (let index = start; index < program.length; index += 1) {
		const char = program[index] ?? ""
		if (isQuote(char)) {
			index = closingQuote(program, index)
			continue
		}
		const before = depth
		depth += depthChange(char)
		if (before !== 0) continue
		if (char === ")") return { close: index, commas }
		if (char === ",") commas.push(index)
	}
	return { close: undefined, commas }
}

/** The top-level arguments of the call whose `(` ends just before `start`, `undefined` if unclosed. */
function callArguments(program: string, start: number): readonly string[] | undefined {
	const { close, commas } = scanCall(program, start)
	if (close === undefined) return undefined
	const starts = [start, ...commas.map((comma) => comma + 1)]
	const ends = [...commas, close]
	return starts
		.map((from, index) => program.slice(from, ends[index] ?? close).trim())
		.filter((argument) => argument !== "")
}

/** Whether `argument` is an inline literal or an identifier the fence declares. */
function isDefined(argument: string, declared: ReadonlySet<string>): boolean {
	if (argument.startsWith("{") || argument.startsWith("[")) return true
	return IDENTIFIER.test(argument) && declared.has(argument)
}

/** Every `project()` argument in `program` that the fence neither inlines nor declares. */
export function undefinedProjectArguments(program: string): readonly UndefinedProjectArgument[] {
	const declared = declaredNames(program)
	return [...program.matchAll(CALL)].flatMap((match, call) => {
		const args = callArguments(program, (match.index ?? 0) + match[0].length)
		if (args === undefined) return []
		return args.flatMap((source, index) =>
			isDefined(source, declared) ? [] : [{ call, index, source }],
		)
	})
}
