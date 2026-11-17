import { describe, expect, test } from "bun:test"
import { declarationsOf, declarationValue } from "../lib/css-declarations"

const SHELL_PATH = "src/styles/shell-layout.css"
const SEAM_PATH = "src/styles/theme-seam.css"

/** One child of the reading column: a heading, a paragraph, the content body. */
const READING_COLUMN_CHILD = "#nd-notebook-layout #nd-page > *"

/** The sidebar's Tab dropdown, which the one-row header replaces from lg up. */
const SIDEBAR_TABS = "#nd-sidebar [data-sidebar-tabs]"

/** The scroll area under the sidebar's top block, in the desktop sidebar and the drawer. */
const SIDEBAR_SCOPE = ":where(#nd-sidebar, #nd-sidebar-mobile)"

async function shellCss(): Promise<string> {
	return Bun.file(SHELL_PATH).text()
}

/** The declarations of the first `@media` block whose condition is `condition`. */
export function mediaBlock(css: string, condition: string): string {
	const start = css.indexOf(`@media ${condition}`)
	if (start === -1) return ""
	let depth = 0
	for (let index = css.indexOf("{", start); index < css.length; index += 1) {
		if (css[index] === "{") depth += 1
		if (css[index] === "}") {
			depth -= 1
			if (depth === 0) return css.slice(css.indexOf("{", start) + 1, index)
		}
	}
	return ""
}

describe("shell layout stylesheet", () => {
	test("caps and centres the reading column from the seam's measure, not a literal", async () => {
		const css = await shellCss()
		const child = declarationsOf(css, READING_COLUMN_CHILD)
		expect(declarationValue(child, "width")).toBe("100%")
		expect(declarationValue(child, "max-width")).toBe("var(--fd-reading-measure)")
		expect(declarationValue(child, "margin-inline")).toBe("auto")
	})

	test("takes the reading measure from the seam and never restates it", async () => {
		const shell = await shellCss()
		const seam = await Bun.file(SEAM_PATH).text()
		expect(shell).not.toMatch(/\b900px\b/)
		expect(shell).toContain("var(--fd-reading-measure)")
		expect(seam.match(/--fd-reading-measure\s*:/g) ?? []).toHaveLength(1)
	})

	test("centres the header Tabs on the page", async () => {
		const css = await shellCss()
		const body = declarationsOf(css, "#nd-subnav [data-header-body]")
		expect(declarationValue(body, "position")).toBe("relative")
		const tabs = declarationsOf(css, "#nd-subnav [data-shell-tabs]")
		expect(declarationValue(tabs, "position")).toBe("absolute")
		expect(declarationValue(tabs, "inset-inline-start")).toBe("50%")
		expect(declarationValue(tabs, "translate")).toBe("-50% 0")
	})

	test("hides the sidebar's Tab dropdown from lg up, where the header carries the Tabs", async () => {
		const css = await shellCss()
		const declarations = declarationsOf(mediaBlock(css, "(min-width: 64rem)"), SIDEBAR_TABS)
		expect(declarationValue(declarations, "display")).toBe("none")
	})

	test("ships Twenty's rhythm for the sidebar tree", async () => {
		const css = await shellCss()
		const tree = declarationsOf(css, `${SIDEBAR_SCOPE} [data-sidebar-top-block] + div > div`)
		expect(declarationValue(tree, "padding")).toBe("0.75rem")
		const rows = declarationsOf(
			css,
			`${SIDEBAR_SCOPE} [data-sidebar-top-block] + div > div > div > * + *`,
		)
		expect(declarationValue(rows, "margin-block-start")).toBe("0.25rem")
		const row = declarationsOf(css, `${SIDEBAR_SCOPE} :is(a, button)`)
		expect(declarationValue(row, "min-height")).toBe("2.25rem")
		const dropdown = declarationsOf(css, `${SIDEBAR_SCOPE} [data-sidebar-tabs] :is(a, button)`)
		expect(declarationValue(dropdown, "width")).toBe("100%")
	})

	test("the geometry stylesheet declares no colour, radius, shadow, font or scale of its own", async () => {
		const css = await shellCss()
		const { findSeamViolations } = await import("../lib/theme-seam")
		expect(findSeamViolations(css).map((violation) => violation.rule)).toEqual([])
	})
})
