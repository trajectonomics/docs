import { describe, expect, test } from "bun:test"
import { Glob } from "bun"
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

function declarationValue(declarations: string, property: string): string | undefined {
	return new RegExp(`${property}\\s*:\\s*([^;]+)`).exec(declarations)?.[1]?.trim()
}

describe("theme seam", () => {
	test("only the seam stylesheet defines a colour, a font family, a border radius or the layout width", async () => {
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

	test("the seam owns the font family", async () => {
		const css = await Bun.file(SEAM_PATH).text()
		expect(declarationsOf(css, ":root")).toMatch(/--font-sans:\s*"Inter Variable"/)
	})

	test("the seam caps the layout at 1400px once, on :root", async () => {
		const css = await Bun.file(SEAM_PATH).text()
		expect(css.match(/--fd-layout-width\s*:/g) ?? []).toHaveLength(1)
		expect(declarationsOf(css, ":root")).toMatch(/--fd-layout-width:\s*1400px;/)
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
