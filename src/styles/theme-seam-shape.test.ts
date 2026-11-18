import { describe, expect, test } from "bun:test"
import { declarationsOf, declarationValue } from "../lib/css-declarations"
import { findSeamViolations } from "../lib/theme-seam"

const SEAM_PATH = "src/styles/theme-seam.css"

/**
 * Radius roles the shell consumes, in the design-system's order. The shell maps any of them, but
 * none above the card role, so no surface is rounder than a Site card.
 */
const SHELL_RADII = ["sm", "md", "lg", "xl", "2xl", "3xl"] as const

/** The card role (`radius.md`): the largest corner the Docs Portal draws. */
const CARD_ROLE = "md"

/** Fumadocs' floating panels, which separate from the page by a hairline instead of a shadow. */
const FLAT_PANELS = [
	"#nd-nav > div",
	"#nd-sidebar-mobile",
	"[data-toc-popover] > header",
	'[role="dialog"]',
] as const

/** The header and sidebar controls whose soft shadow was their only focus affordance. */
const CONTROLS =
	"#nd-notebook-layout :is(#nd-subnav, #nd-sidebar, #nd-sidebar-mobile) :is(a, button):focus-visible"

async function seamCss(): Promise<string> {
	return Bun.file(SEAM_PATH).text()
}

/** The seam without its comments, so a comment that names a role is not a declaration. */
function withoutComments(css: string): string {
	return css.replace(/\/\*[\s\S]*?\*\//g, "")
}

describe("theme seam shape", () => {
	test("the shell declares its radius roles once, on :root, for every layout", async () => {
		const css = await seamCss()
		const declared = [...withoutComments(css).matchAll(/(--radius-[\w-]+)\s*:/g)]
			.map((match) => match[1])
			.sort()
		expect(declared).toEqual(SHELL_RADII.map((role) => `--radius-${role}`).sort())
	})

	test("every radius maps a design-system role no larger than the card role", async () => {
		const css = await seamCss()
		const root = declarationsOf(css, ":root")
		const order: readonly string[] = SHELL_RADII
		for (const role of SHELL_RADII) {
			const value = declarationValue(root, `--radius-${role}`)
			const mapped = /^var\(--ds-radius-(\w+)\)$/.exec(value ?? "")
			expect(mapped, `--radius-${role} takes a design-system radius role`).not.toBeNull()
			const source = order.indexOf(mapped?.[1] ?? "")
			expect(source, `--radius-${role} maps a published radius role`).toBeGreaterThanOrEqual(0)
			expect(source, `--radius-${role} is capped at the card role`).toBeLessThanOrEqual(
				order.indexOf(CARD_ROLE),
			)
		}
	})

	test("the seam declares radius only as the roles it maps, never a corner of its own", async () => {
		const css = await seamCss()
		const lines = css.split("\n")
		for (const corner of findSeamViolations(css).filter(
			(violation) => violation.rule === "border-radius",
		)) {
			expect(lines[corner.line - 1]?.trim(), `line ${corner.line}`).toMatch(/^--radius-[\w-]+:/)
		}
	})

	test("the seam paints no shadow and keeps no shadow role", async () => {
		const css = await seamCss()
		const lines = css.split("\n")
		const shadows = findSeamViolations(css).filter((violation) => violation.rule === "shadow")
		for (const shadow of shadows) {
			expect(lines[shadow.line - 1]?.trim()).toBe("box-shadow: none;")
		}
		expect(withoutComments(css)).not.toMatch(/--(?:text-)?shadow[\w-]*\s*:/)
	})

	test("keyboard focus on the header and sidebar controls is a ring, not a shadow", async () => {
		const css = await seamCss()
		const declarations = declarationsOf(css, CONTROLS)
		expect(declarationValue(declarations, "outline")).toBe("2px solid var(--ds-color-ring)")
		expect(declarationValue(declarations, "outline-offset")).toBeDefined()
	})

	test("Fumadocs' floating panels take a hairline instead of a shadow", async () => {
		const css = await seamCss()
		for (const panel of FLAT_PANELS) {
			expect(declarationValue(declarationsOf(css, panel), "box-shadow"), panel).toBe("none")
		}
	})
})
