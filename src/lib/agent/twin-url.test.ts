import { describe, expect, test } from "bun:test"
import { twinUrl } from "./twin-url"

const ORIGIN = "https://trajectonomics.com"

describe("the absolute URL of a page's Markdown twin", () => {
	test.each([
		["/docs/cli", "https://trajectonomics.com/docs/cli.md"],
		["/docs/cli/installation", "https://trajectonomics.com/docs/cli/installation.md"],
		["/docs/cli/commands/tx", "https://trajectonomics.com/docs/cli/commands/tx.md"],
		["/docs/", "https://trajectonomics.com/docs/index.md"],
	])("the twin of %s is %s", (pageUrl, url) => {
		expect(twinUrl(ORIGIN, pageUrl)).toBe(url)
	})
})
