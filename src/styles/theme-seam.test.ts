import { describe, expect, test } from "bun:test"
import { Glob } from "bun"
import { declarationsOf, declarationValue } from "../lib/css-declarations"
import { findSeamViolations } from "../lib/theme-seam"

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

/** Type-scale roles the shell takes from the design system. */
const SHELL_TYPE_SCALE = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl"] as const

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

function colourVariables(declarations: string): readonly string[] {
	const names = [...declarations.matchAll(/(--color-fd-[\w-]+)\s*:/g)].map((match) => match[1])
	return names.filter((name): name is string => name !== undefined).sort()
}

describe("theme seam", () => {
	test("only the seam stylesheet defines a colour, a font family, a border radius, a shadow or a scale", async () => {
		const stylesheets = await projectStylesheets()
		const paths = stylesheets.map((stylesheet) => stylesheet.path)
		expect(paths).toContain(GLOBAL_PATH)
		expect(paths).toContain(SEAM_PATH)

		const found: string[] = []
		for (const stylesheet of stylesheets) {
			if (stylesheet.path === SEAM_PATH) continue
			for (const violation of findSeamViolations(stylesheet.css)) {
				found.push(`${stylesheet.path}:${violation.line} ${violation.rule}`)
			}
		}
		expect(found).toEqual([])
	})

	test("the seam maps every shell colour from a design-system role on :root", async () => {
		const css = await Bun.file(SEAM_PATH).text()
		const declarations = declarationsOf(css, ":root")
		const mapped = colourVariables(declarations).filter((name) => name !== "--color-fd-overlay")
		expect(mapped).toEqual(SHELL_COLOURS.filter((name) => name !== "--color-fd-overlay").sort())
		for (const name of mapped) {
			expect(declarationValue(declarations, name)).toBe(
				`var(${name.replace("--color-fd-", "--ds-color-")})`,
			)
		}
	})

	test("the modal overlay has no design-system role and stays a seam literal", async () => {
		const css = await Bun.file(SEAM_PATH).text()
		const overlay = declarationValue(declarationsOf(css, ":root"), "--color-fd-overlay")
		expect(overlay).toMatch(/^hsla?\(/)
	})

	test("the seam keeps Inter Variable first and takes the rest of the stack from the font role", async () => {
		const css = await Bun.file(SEAM_PATH).text()
		const root = declarationsOf(css, ":root")
		const sans = declarationValue(root, "--font-sans")
		expect(sans).toContain('"Inter Variable"')
		expect(sans).toContain("var(--ds-font-family-sans)")
		expect(declarationValue(root, "--font-mono")).toBe("var(--ds-font-family-mono)")
	})

	test("the seam maps the type scale from the design-system font-size roles", async () => {
		const css = await Bun.file(SEAM_PATH).text()
		const root = declarationsOf(css, ":root")
		for (const role of SHELL_TYPE_SCALE) {
			expect(declarationValue(root, `--text-${role}`)).toBe(`var(--ds-font-size-${role})`)
		}
	})

	test("the seam maps Tailwind's spacing unit from the design-system spacing scale", async () => {
		const css = await Bun.file(SEAM_PATH).text()
		expect(declarationValue(declarationsOf(css, ":root"), "--spacing")).toBe("var(--ds-space-1)")
	})

	test("the search trigger keeps neutral chrome on hover", async () => {
		const css = await Bun.file(SEAM_PATH).text()
		const declarations = declarationsOf(
			css,
			"#nd-notebook-layout #nd-subnav :is([data-search], [data-search-full]):is(:hover, :focus-visible)",
		)
		expect(declarationValue(declarations, "background-color")).toBe("var(--ds-color-secondary)")
		expect(declarationValue(declarations, "color")).toBe("var(--ds-color-foreground)")
	})

	test("the seam caps the layout at 1400px once, on :root", async () => {
		const css = await Bun.file(SEAM_PATH).text()
		expect(css.match(/--fd-layout-width\s*:/g) ?? []).toHaveLength(1)
		expect(declarationsOf(css, ":root")).toMatch(/--fd-layout-width:\s*1400px;/)
	})

	test("the global stylesheet imports the assets font stylesheet and not the fontsource package", async () => {
		const css = await Bun.file(GLOBAL_PATH).text()
		const imports = [...css.matchAll(/@import\s+"([^"]+)"/g)].map((match) => match[1])
		expect(imports).toContain("@trajectonomics/design-system-assets/fonts/inter.css")
		expect(imports).not.toContain("@fontsource-variable/inter/index.css")
	})

	test("the global stylesheet imports both design-system themes and the seam last", async () => {
		const css = await Bun.file(GLOBAL_PATH).text()
		const imports = [...css.matchAll(/@import\s+"([^"]+)"/g)].map((match) => match[1])
		expect(imports).toContain("fumadocs-ui/css/neutral.css")
		expect(imports).toContain("@trajectonomics/design-system-theme/themes/light.css")
		expect(imports).toContain("@trajectonomics/design-system-theme/themes/dark.css")
		expect(imports.indexOf("./theme-seam.css")).toBeGreaterThan(
			imports.indexOf("fumadocs-ui/css/neutral.css"),
		)
		expect(imports.indexOf("./theme-seam.css")).toBeGreaterThan(
			imports.indexOf("@trajectonomics/design-system-theme/themes/dark.css"),
		)
	})
})
