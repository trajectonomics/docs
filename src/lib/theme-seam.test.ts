import { describe, expect, test } from "bun:test"
import { findSeamViolations } from "./theme-seam"

const COLOUR_DECLARATIONS = [
	".x { color: #ffffff; }",
	".x { background: hsl(0, 0%, 96%); }",
	".x { border: 1px solid pink; }",
	".x { background-image: linear-gradient(red, blue); }",
	".x { border-image: linear-gradient(red, blue) 1; }",
	".x { text-decoration: underline red; }",
	".x { text-emphasis-color: red; }",
	".x { scrollbar-color: red blue; }",
	".x { filter: drop-shadow(0 0 2px red); }",
	".x { backdrop-filter: drop-shadow(0 0 2px red); }",
	".x { -webkit-text-fill-color: red; }",
	".x { -webkit-text-stroke: 1px red; }",
	".x { -webkit-tap-highlight-color: red; }",
	".x { -webkit-box-shadow: 0 0 1px red; }",
	".x { -webkit-mask: linear-gradient(red, blue); }",
	".x { mask-border: linear-gradient(red, blue) 1; }",
	".x { caret: red block; }",
	"@property --a { initial-value: red; }",
	":root { --brand: red; }",
	":root { --color-fd-accent: oklch(62% 0.2 259); }",
] as const

const FONT_DECLARATIONS = [
	".x { font-family: Inter, sans-serif; }",
	":root { --font-sans: Inter, sans-serif; }",
	":root { --default-mono-font-family: Menlo, monospace; }",
] as const

const RADIUS_DECLARATIONS = [
	".x { border-radius: 4px; }",
	".x { border-top-left-radius: 4px; }",
	":root { --radius: 6px; }",
	".x { -webkit-border-radius: 4px; }",
	".x { -webkit-border-top-left-radius: 4px; }",
	".x { -moz-border-radius-topleft: 4px; }",
] as const

const ALLOWED_DECLARATIONS = [
	"/* #fff, Inter, 4px, --fd-layout-width */ .x { display: block; }",
	".x { display: grid; gap: 1rem; margin: 0 auto; }",
	".x { color: inherit; }",
	".x { font: inherit; }",
	".x { font-family: inherit; }",
	".x { font-family: inherit !important; }",
	".x { border-color: var(--color-fd-border); }",
	".x { filter: url(#add); }",
	".x { mask: url(#mask); }",
	".x { background-image: url(/img/hero.png); }",
	".x { animation: gold-fade 1s; }",
	'.x { content: "red"; }',
	".x { background: url(/img/red.png); }",
] as const

function rules(css: string): readonly string[] {
	return findSeamViolations(css).map((violation) => violation.rule)
}

describe("findSeamViolations", () => {
	for (const css of COLOUR_DECLARATIONS) {
		test(`a colour belongs in the seam: ${css}`, () => {
			expect(rules(css)).toEqual(["colour"])
		})
	}

	for (const css of FONT_DECLARATIONS) {
		test(`a font family belongs in the seam: ${css}`, () => {
			expect(rules(css)).toEqual(["font-family"])
		})
	}

	for (const css of RADIUS_DECLARATIONS) {
		test(`a border radius belongs in the seam: ${css}`, () => {
			expect(rules(css)).toEqual(["border-radius"])
		})
	}

	test("the layout width belongs in the seam", () => {
		expect(rules(":root { --fd-layout-width: 1400px; }")).toEqual(["layout-width"])
	})

	for (const css of ALLOWED_DECLARATIONS) {
		test(`the seam does not own this declaration: ${css}`, () => {
			expect(rules(css)).toEqual([])
		})
	}

	test("the reported line is where the declaration starts", () => {
		expect(findSeamViolations(".x {\n\tdisplay: block;\n\tcolor: red;\n}")).toEqual([
			{ rule: "colour", line: 3 },
		])
	})
})
