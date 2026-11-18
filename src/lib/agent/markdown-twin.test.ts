import { describe, expect, test } from "bun:test"
import { buildMarkdownTwin, MarkdownTwinError, type PageTwinSource } from "./markdown-twin"

const ORIGIN = "https://trajectonomics.com"

/** The authored page every test starts from: one title, one description, one line of body. */
const PAGE: PageTwinSource = {
	title: "tx",
	description: "Manage ledger transactions.",
	body: "`traj tx` manages ledger transactions.",
}

/** The code of the error `buildMarkdownTwin` refuses a page with, or `undefined` when it builds. */
function errorCodeOf(page: PageTwinSource): string | undefined {
	try {
		buildMarkdownTwin(page, ORIGIN)
		return undefined
	} catch (error) {
		return error instanceof MarkdownTwinError ? error.code : "not-a-markdown-twin-error"
	}
}

describe("a page's Markdown twin", () => {
	test("begins with the page's title and description, then its Markdown body", () => {
		expect(buildMarkdownTwin(PAGE, ORIGIN)).toBe(
			"# tx\n\n> Manage ledger transactions.\n\n`traj tx` manages ledger transactions.\n",
		)
	})

	test("makes an internal link absolute and leaves an external one untouched", () => {
		const twin = buildMarkdownTwin(
			{
				...PAGE,
				body: "[Commands](/docs/cli/commands/) and [npm](https://www.npmjs.com/package/x).",
			},
			ORIGIN,
		)
		expect(twin).toBe(
			"# tx\n\n> Manage ledger transactions.\n\n[Commands](https://trajectonomics.com/docs/cli/commands/) and [npm](https://www.npmjs.com/package/x).\n",
		)
	})

	test("keeps a page without a description to its title and body", () => {
		expect(buildMarkdownTwin({ title: "tx", body: "Body." }, ORIGIN)).toBe("# tx\n\nBody.\n")
	})

	test("a body carrying a JSX component has no faithful twin and is refused as JSX_BODY", () => {
		expect(errorCodeOf({ ...PAGE, body: "<Callout>Heads up</Callout>" })).toBe("JSX_BODY")
		expect(errorCodeOf({ ...PAGE, body: '<div className="x">Body.</div>' })).toBe("JSX_BODY")
	})

	test("a JSX-looking tag quoted in a fence or inline code is body text, not a component", () => {
		expect(
			buildMarkdownTwin({ ...PAGE, body: "```tsx\n<Callout>Body.</Callout>\n```" }, ORIGIN),
		).toBe("# tx\n\n> Manage ledger transactions.\n\n```tsx\n<Callout>Body.</Callout>\n```\n")
		expect(buildMarkdownTwin({ ...PAGE, body: "Write `<Callout>` for a callout." }, ORIGIN)).toBe(
			"# tx\n\n> Manage ledger transactions.\n\nWrite `<Callout>` for a callout.\n",
		)
	})
})
