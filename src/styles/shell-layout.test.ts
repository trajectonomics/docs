import { describe, expect, test } from "bun:test"
import { declarationsOf, declarationValue } from "../lib/css-declarations"

const SHELL_PATH = "src/styles/shell-layout.css"
const SEAM_PATH = "src/styles/theme-seam.css"

/** One child of the reading column: a heading, a paragraph, the content body. */
const READING_COLUMN_CHILD = "#nd-notebook-layout #nd-page > *"

/** The page's own content: the prose wrapper the MDX pipeline renders for it. */
const READING_COLUMN_PROSE = "#nd-notebook-layout #nd-page .prose"

/** The sidebar's Tab dropdown, which the one-row header replaces from lg up. */
const SIDEBAR_TABS = "#nd-sidebar [data-sidebar-tabs]"

/** The scroll area under the sidebar's top block, in the desktop sidebar and the drawer. */
const SIDEBAR_SCOPE = ":where(#nd-sidebar, #nd-sidebar-mobile)"

async function shellCss(): Promise<string> {
	return Bun.file(SHELL_PATH).text()
}

/** The declarations of the first `@media` block whose condition is `condition`. */
function mediaBlock(css: string, condition: string): string {
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
		for (const selector of [READING_COLUMN_CHILD, READING_COLUMN_PROSE]) {
			const child = declarationsOf(css, selector)
			expect(declarationValue(child, "width"), selector).toBe("100%")
			expect(declarationValue(child, "max-width"), selector).toBe("var(--fd-reading-measure)")
			expect(declarationValue(child, "margin-inline"), selector).toBe("auto")
		}
	})

	test("takes the reading measure from the seam and never restates it", async () => {
		const shell = await shellCss()
		expect(shell).not.toMatch(/\b900px\b/)
		expect(shell).toContain("var(--fd-reading-measure)")
		expect(await Bun.file(SEAM_PATH).text()).toMatch(/--fd-reading-measure:\s*900px;/)
	})

	test("keeps the sidebar's column flush at the page edge", async () => {
		const css = await shellCss()
		expect(declarationValue(declarationsOf(css, "#nd-sidebar"), "align-items")).toBe("start")
	})

	test("hides the sidebar's Tab dropdown from lg up, where the header carries the Tabs", async () => {
		const css = await shellCss()
		const declarations = declarationsOf(mediaBlock(css, "(min-width: 64rem)"), SIDEBAR_TABS)
		expect(declarationValue(declarations, "display")).toBe("none")
	})

	test("ships Twenty's rhythm for the sidebar's rows and the Tab dropdown's width", async () => {
		const css = await shellCss()
		const tree = declarationsOf(css, `${SIDEBAR_SCOPE} [data-radix-scroll-area-viewport]`)
		expect(declarationValue(tree, "padding")).toBe("0.75rem")
		const row = declarationsOf(css, `${SIDEBAR_SCOPE} :is(a, button)`)
		expect(declarationValue(row, "min-height")).toBe("2.25rem")
		const dropdown = declarationsOf(css, `${SIDEBAR_SCOPE} [data-sidebar-tabs] [data-state]`)
		expect(declarationValue(dropdown, "width")).toBe("100%")
	})

	test("the geometry stylesheet declares no colour, radius, shadow, font or scale of its own", async () => {
		const { findSeamViolations } = await import("../lib/theme-seam")
		expect(findSeamViolations(await shellCss()).map((violation) => violation.rule)).toEqual([])
	})
})
