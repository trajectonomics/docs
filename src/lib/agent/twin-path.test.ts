import { describe, expect, test } from "bun:test"
import { twinPath } from "./twin-path"

describe("the path of a page's Markdown twin", () => {
	test("a page's twin is its path with `.md` in place of the trailing slash", () => {
		expect(twinPath("/docs/cli/commands/tx")).toBe("/docs/cli/commands/tx.md")
		expect(twinPath("/docs/cli/commands/tx/")).toBe("/docs/cli/commands/tx.md")
	})

	test("a folder index page's twin sits beside the folder, never at its index path", () => {
		expect(twinPath("/docs/cli")).toBe("/docs/cli.md")
		expect(twinPath("/docs/cli/")).toBe("/docs/cli.md")
		expect(twinPath("/docs/cli/commands")).toBe("/docs/cli/commands.md")
	})

	test("the Landing Page's twin is /docs/index.md", () => {
		expect(twinPath("/docs")).toBe("/docs/index.md")
		expect(twinPath("/docs/")).toBe("/docs/index.md")
	})
})
