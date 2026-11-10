import { describe, expect, test } from "bun:test"
import { Glob } from "bun"
import { findSeamViolations } from "./theme-seam"

const SEAM_PATH = "src/styles/theme-seam.css"
const GLOBAL_PATH = "src/styles/global.css"

/** Colour variables the Docs Portal shell reads; the seam defines each one for light and dark. */
const SHELL_COLOURS = [
	"--color-fd-accent",
	"--color-fd-accent-foreground",
	"--color-fd-background",
	"--color-fd-border",
	"--color-fd-card",
	"--color-fd-card-foreground",
	"--color-fd-foreground",
	"--color-fd-muted",
	"--color-fd-muted-foreground",
	"--color-fd-overlay",
	"--color-fd-popover",
	"--color-fd-popover-foreground",
	"--color-fd-primary",
	"--color-fd-primary-foreground",
	"--color-fd-ring",
	"--color-fd-secondary",
	"--color-fd-secondary-foreground",
]

const RULES = {
	colour: "colour",
	fontFamily: "font-family",
	borderRadius: "border-radius",
	layoutWidth: "layout-width",
} as const

interface Stylesheet {
	readonly path: string
	readonly css: string
}

async function projectStylesheets(): Promise<readonly Stylesheet[]> {
	const stylesheets: Stylesheet[] = []
	for await (const path of new Glob("src/**/*.css").scan(".")) {
		stylesheets.push({ path, css: await Bun.file(path).text() })
	}
	return stylesheets
}

/** Declarations inside the first block whose selector is exactly `selector`. */
function declarationsOf(css: string, selector: string): string {
	const selectorStart = css.indexOf(`${selector} {`)
	if (selectorStart === -1) return ""
	const bodyStart = css.indexOf("{", selectorStart) + 1
	return css.slice(bodyStart, css.indexOf("}", bodyStart))
}

function colourVariables(declarations: string): readonly string[] {
	const names = [...declarations.matchAll(/(--color-fd-[\w-]+)\s*:/g)].map((match) => match[1])
	return names.filter((name): name is string => name !== undefined).sort()
}

describe("theme seam", () => {
	test("only the seam stylesheet sets a colour, a font family, a border radius or the layout width", async () => {
		const found: string[] = []
		for (const stylesheet of await projectStylesheets()) {
			if (stylesheet.path === SEAM_PATH) continue
			for (const violation of findSeamViolations(stylesheet.css)) {
				found.push(`${stylesheet.path}:${violation.line} ${violation.rule}`)
			}
		}
		expect(found).toEqual([])
	})

	test("the seam defines the shell's colour variables for light and dark", async () => {
		const css = await Bun.file(SEAM_PATH).text()
		const expected = [...SHELL_COLOURS].sort()
		expect(colourVariables(declarationsOf(css, ":root"))).toEqual(expected)
		expect(colourVariables(declarationsOf(css, ".dark"))).toEqual(expected)
	})

	test("the seam caps the layout at 1400px once, on :root", async () => {
		const css = await Bun.file(SEAM_PATH).text()
		expect(css.match(/--fd-layout-width\s*:/g) ?? []).toHaveLength(1)
		expect(declarationsOf(css, ":root")).toMatch(/--fd-layout-width:\s*1400px;/)
	})

	test("the global stylesheet imports the seam after the neutral preset", async () => {
		const css = await Bun.file(GLOBAL_PATH).text()
		const imports = [...css.matchAll(/@import\s+"([^"]+)"/g)].map((match) => match[1])
		expect(imports).toContain("fumadocs-ui/css/neutral.css")
		expect(imports.indexOf("./theme-seam.css")).toBeGreaterThan(
			imports.indexOf("fumadocs-ui/css/neutral.css"),
		)
	})
})

describe("findSeamViolations", () => {
	function rules(css: string): readonly string[] {
		return findSeamViolations(css).map((violation) => violation.rule)
	}

	test("a colour belongs in the seam", () => {
		expect(rules(".x { color: #ffffff; }")).toEqual([RULES.colour])
		expect(rules(".x { background: hsl(0, 0%, 96%); }")).toEqual([RULES.colour])
		expect(rules(".x { border: 1px solid white; }")).toEqual([RULES.colour])
		expect(rules(".x { outline: var(--color-fd-border); }")).toEqual([RULES.colour])
		expect(rules(":root { --color-fd-accent: oklch(62% 0.2 259); }")).toEqual([RULES.colour])
	})

	test("a font family belongs in the seam", () => {
		expect(rules(".x { font-family: Inter, sans-serif; }")).toEqual([RULES.fontFamily])
		expect(rules(":root { --font-sans: Inter, sans-serif; }")).toEqual([RULES.fontFamily])
	})

	test("a border radius belongs in the seam", () => {
		expect(rules(".x { border-radius: 4px; }")).toEqual([RULES.borderRadius])
		expect(rules(".x { border-top-left-radius: 4px; }")).toEqual([RULES.borderRadius])
	})

	test("the layout width belongs in the seam", () => {
		expect(rules(":root { --fd-layout-width: 1400px; }")).toEqual([RULES.layoutWidth])
	})

	test("a comment mentioning a colour, a font or a radius is not a declaration", () => {
		expect(rules("/* #fff, Inter, 4px, --fd-layout-width */ .x { display: block; }")).toEqual([])
	})

	test("a declaration the seam does not own is allowed elsewhere", () => {
		expect(rules(".x { display: grid; gap: 1rem; margin: 0 auto; }")).toEqual([])
	})

	test("the reported line is where the declaration starts", () => {
		expect(findSeamViolations(".x {\n\tdisplay: block;\n\tcolor: red;\n}")).toEqual([
			{ rule: RULES.colour, line: 3 },
		])
	})
})
