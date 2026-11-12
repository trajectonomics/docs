/** A declaration kind the theme seam stylesheet must own. */
export type SeamRule = "colour" | "font-family" | "border-radius" | "layout-width"

/** One declaration in a project stylesheet that belongs in the theme seam. */
export interface SeamViolation {
	readonly rule: SeamRule
	/** 1-based line where the declaration starts. */
	readonly line: number
}

const DECLARATION = /([-\w]+)\s*:\s*([^;{}]+)(?=[;}])/g
const COLOUR_LITERAL =
	/#[\da-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color|color-mix|light-dark)\s*\(/i
const COLOUR_TOKEN = /^--color-/
const COLOUR_PROPERTY =
	/^(?:color|background|background-color|background-image|border|border-color|border-(?:top|right|bottom|left|block|inline)(?:-(?:start|end))?(?:-color)?|border-image|border-image-source|outline|outline-color|fill|stroke|box-shadow|text-shadow|accent-color|caret-color|text-decoration|text-decoration-color|text-emphasis|text-emphasis-color|column-rule|column-rule-color|scrollbar-color|mask|mask-image|stop-color|flood-color|lighting-color)$/i
/** Every CSS named colour; `transparent` and `currentColor` carry no palette and are allowed. */
const NAMED_COLOURS = [
	"aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet",
	"brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue",
	"darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange",
	"darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise",
	"darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia",
	"gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo",
	"ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan",
	"lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue",
	"lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon",
	"mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue",
	"mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin",
	"navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen",
	"paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red",
	"rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue",
	"slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white",
	"whitesmoke yellow yellowgreen",
].join(" ")
const NAMED_COLOUR = new RegExp(
	`(?<![\\w-])(?:${NAMED_COLOURS.replaceAll(" ", "|")})(?![\\w-])`,
	"i",
)
const FONT_PROPERTY = /^(?:font|font-family|--(?:default-)?font-[\w-]+)$/i
const RADIUS_PROPERTY = /^(?:border(?:-[\w-]+)?-radius|--radius(?:-[\w-]+)?)$/i
const LAYOUT_WIDTH_PROPERTY = /^--fd-layout-width$/i
const GLOBAL_KEYWORD = /^(?:inherit|initial|unset|revert|revert-layer)$/i
const URL_FUNCTION = /url\([^)]*\)/gi
const VAR_FUNCTION = /var\([^)]*\)/gi

/*
 * Tailwind `@apply` utilities are deliberately out of scope: this rule reads
 * `name: value` declarations, and an `@apply` line carries utility names, not
 * values. The shell uses className utilities in JSX.
 */

/** The declarations in one stylesheet that only the theme seam may define. */
export function findSeamViolations(css: string): readonly SeamViolation[] {
	const source = withoutComments(css)
	const violations: SeamViolation[] = []
	for (const match of source.matchAll(DECLARATION)) {
		const rule = classify(match[1] ?? "", match[2] ?? "")
		if (rule !== undefined) {
			violations.push({ rule, line: lineNumberAt(source, match.index ?? 0) })
		}
	}
	return violations
}

function withoutComments(css: string): string {
	return css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, " "))
}

function withoutStrings(value: string): string {
	return value.replace(/"[^"]*"|'[^']*'/g, " ")
}

function lineNumberAt(source: string, index: number): number {
	return source.slice(0, index).split("\n").length
}

function classify(property: string, value: string): SeamRule | undefined {
	if (LAYOUT_WIDTH_PROPERTY.test(property)) return "layout-width"
	if (FONT_PROPERTY.test(property)) {
		const namesAFamily = /^(?:font|font-family)$/i.test(property)
		return namesAFamily && GLOBAL_KEYWORD.test(value.trim()) ? undefined : "font-family"
	}
	if (RADIUS_PROPERTY.test(property)) return "border-radius"
	if (isColour(property, value)) return "colour"
	return undefined
}

function isColour(property: string, value: string): boolean {
	if (COLOUR_TOKEN.test(property)) return true
	const unquoted = withoutStrings(value).replace(URL_FUNCTION, " ")
	if (COLOUR_LITERAL.test(unquoted)) return true
	// A `var(--color-*)` reference is how another stylesheet consumes the seam, not a colour of its own.
	const named = unquoted.replace(VAR_FUNCTION, " ")
	return COLOUR_PROPERTY.test(property) && NAMED_COLOUR.test(named)
}
