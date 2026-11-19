import { describe, expect, test } from "bun:test"
import { pageTwinPath } from "./page-twin-path"

// Only a page URL negotiates: a request for its twin, the Docs index, an asset or the bare
// `/docs` (which the assets redirect) keeps the answer it has today (ADR 0010).
const cases: readonly (readonly [string, string | null])[] = [
	["/docs/", "/docs/index.md"],
	["/docs/cli/", "/docs/cli.md"],
	["/docs/cli/commands/tx/", "/docs/cli/commands/tx.md"],
	["/docs", null],
	["/docs/cli", null],
	["/docs/cli/commands/tx.md", null],
	["/docs/llms.txt", null],
	["/docs/sitemap.xml", null],
	["/docs/_astro/app.css", null],
	["/", null],
	["/blog/", null],
]

describe("a page URL asks for its Markdown twin", () => {
	for (const [pathname, expected] of cases) {
		test(`${pathname} has the twin ${expected ?? "(none)"}`, () => {
			expect(pageTwinPath(pathname)).toBe(expected)
		})
	}
})
