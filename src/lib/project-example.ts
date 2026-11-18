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

/** The index of the quote closing the string that starts at `start`, `undefined` if unterminated. */
function closingQuote(text: string, start: number): number | undefined {
	const quote = text[start]
	for (let index = start + 1; index < text.length; index += 1) {
		const char = text[index]
		if (char === "\\") index += 1
		else if (char === quote) return index
	}
	return undefined
}

/** The names `program` declares with `const`, `let` or `var`. */
function declaredNames(program: string): ReadonlySet<string> {
	return new Set([...program.matchAll(DECLARATION)].flatMap((match) => match[1] ?? []))
}

/** The index of the `)` closing the call opened just before `start`, `undefined` if unclosed. */
function closingParen(program: string, start: number): number | undefined {
	let depth = 0
	for (let index = start; index < program.length; index += 1) {
		const char = program[index] ?? ""
		if (isQuote(char)) {
			index = closingQuote(program, index) ?? program.length
		} else if (char === ")" && depth === 0) {
			return index
		} else {
			depth += depthChange(char)
		}
	}
	return undefined
}

/** The top-level arguments of a call, from the text between its parentheses. */
function splitArguments(call: string): readonly string[] {
	const args: string[] = []
	let depth = 0
	let opening = 0
	for (let index = 0; index < call.length; index += 1) {
		const char = call[index] ?? ""
		if (isQuote(char)) {
			index = closingQuote(call, index) ?? call.length
		} else if (char === "," && depth === 0) {
			args.push(call.slice(opening, index).trim())
			opening = index + 1
		} else {
			depth += depthChange(char)
		}
	}
	const last = call.slice(opening).trim()
	return last === "" ? args : [...args, last]
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
		const start = (match.index ?? 0) + match[0].length
		const close = closingParen(program, start)
		if (close === undefined) return []
		return splitArguments(program.slice(start, close)).flatMap((source, index) =>
			isDefined(source, declared) ? [] : [{ call, index, source }],
		)
	})
}
