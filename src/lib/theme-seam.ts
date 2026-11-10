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
const COLOUR_REFERENCE = /var\(\s*--color-/i
const COLOUR_TOKEN = /^--color-/
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
const NAMED_COLOUR = new RegExp(`\\b(?:${NAMED_COLOURS.replaceAll(" ", "|")})\\b`, "i")
const FONT_PROPERTY = /^(?:font|font-family|--(?:default-)?font-[\w-]+)$/i
const RADIUS_PROPERTY = /^(?:border(?:-[\w-]+)?-radius|--radius(?:-[\w-]+)?)$/i
const LAYOUT_WIDTH_PROPERTY = /^--fd-layout-width$/i

/** The declarations in one stylesheet that only the theme seam may set. */
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

function lineNumberAt(source: string, index: number): number {
	return source.slice(0, index).split("\n").length
}

function classify(property: string, value: string): SeamRule | undefined {
	if (LAYOUT_WIDTH_PROPERTY.test(property)) return "layout-width"
	if (FONT_PROPERTY.test(property)) return "font-family"
	if (RADIUS_PROPERTY.test(property)) return "border-radius"
	if (isColour(property, value)) return "colour"
	return undefined
}

function isColour(property: string, value: string): boolean {
	return (
		COLOUR_TOKEN.test(property) ||
		COLOUR_LITERAL.test(value) ||
		COLOUR_REFERENCE.test(value) ||
		NAMED_COLOUR.test(value)
	)
}
