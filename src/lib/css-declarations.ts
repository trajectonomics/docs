/** The declarations of the rule whose selector list contains `selector`, or `""` when none does. */
export function declarationsOf(css: string, selector: string): string {
	const source = css.replace(/\/\*[\s\S]*?\*\//g, "")
	for (const match of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
		if (selectors(match[1] ?? "").includes(selector)) {
			return match[2] ?? ""
		}
	}
	return ""
}

/** The value of one property in a declaration block, or `undefined` when it declares none. */
export function declarationValue(declarations: string, property: string): string | undefined {
	return new RegExp(`(?<![-\\w])${property}\\s*:\\s*([^;]+)`).exec(declarations)?.[1]?.trim()
}

/** A rule's selector list, split on the commas that are not inside a functional pseudo-class. */
function selectors(selectorList: string): readonly string[] {
	const parts: string[] = []
	let depth = 0
	let start = 0
	for (let index = 0; index < selectorList.length; index += 1) {
		const character = selectorList[index]
		if (character === "(") {
			depth += 1
		} else if (character === ")") {
			depth -= 1
		} else if (character === "," && depth === 0) {
			parts.push(selectorList.slice(start, index))
			start = index + 1
		}
	}
	parts.push(selectorList.slice(start))
	return parts.map((part) => part.trim()).filter((part) => part.length > 0)
}
