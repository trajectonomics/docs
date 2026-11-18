import { describe, expect, test } from "bun:test"
import { twinPath } from "./twin-path"

describe("the path of a page's Markdown twin", () => {
	test.each([
		["/docs/cli/commands/tx", "/docs/cli/commands/tx.md"],
		["/docs/cli/commands/tx/", "/docs/cli/commands/tx.md"],
		["/docs/cli/installation", "/docs/cli/installation.md"],
	])(
		"the twin of %s is %s, its path with `.md` in place of the trailing slash",
		(pageUrl, twin) => {
			expect(twinPath(pageUrl)).toBe(twin)
		},
	)

	test.each([
		["/docs/cli", "/docs/cli.md"],
		["/docs/cli/", "/docs/cli.md"],
		["/docs/cli/commands", "/docs/cli/commands.md"],
	])("the twin of the folder index page %s is %s, never an index path", (pageUrl, twin) => {
		expect(twinPath(pageUrl)).toBe(twin)
	})

	test.each([
		["/docs", "/docs/index.md"],
		["/docs/", "/docs/index.md"],
	])("the twin of the Landing Page %s is %s", (pageUrl, twin) => {
		expect(twinPath(pageUrl)).toBe(twin)
	})
})
