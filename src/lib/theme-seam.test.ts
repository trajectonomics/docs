import { describe, expect, test } from "bun:test"
import { findSeamViolations } from "./theme-seam"

const COLOUR_DECLARATIONS = [
	".x { color: #ffffff; }",
	".x { background: hsl(0, 0%, 96%); }",
	".x { border: 1px solid pink; }",
	":root { --color-fd-accent: oklch(62% 0.2 259); }",
] as const

const FONT_DECLARATIONS = [
	".x { font-family: Inter, sans-serif; }",
	":root { --font-sans: Inter, sans-serif; }",
] as const

const RADIUS_DECLARATIONS = [
	".x { border-radius: 4px; }",
	".x { border-top-left-radius: 4px; }",
	":root { --radius: 6px; }",
] as const

const ALLOWED_DECLARATIONS = [
	"/* #fff, Inter, 4px, --fd-layout-width */ .x { display: block; }",
	".x { display: grid; gap: 1rem; margin: 0 auto; }",
	".x { color: inherit; }",
	".x { font: inherit; }",
	".x { border-color: var(--color-fd-border); }",
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
