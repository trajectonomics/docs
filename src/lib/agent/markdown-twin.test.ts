import { describe, expect, test } from "bun:test"
import { indexReference } from "./index-reference"
import { buildMarkdownTwin, MarkdownTwinError, type PageTwinSource } from "./markdown-twin"

const ORIGIN = "https://trajectonomics.com"

/** Every twin ends with this line, the reference to the Docs index it belongs to. */
const INDEX_REFERENCE = indexReference(ORIGIN)

/** The authored page every test starts from: one title, one description, one line of body. */
const PAGE: PageTwinSource = {
	title: "tx",
	description: "Manage ledger transactions.",
	body: "`traj tx` manages ledger transactions.",
}

/** A twin's expected words: the given lines, then the index reference the twin ends with. */
function twin(...lines: readonly string[]): string {
	return [...lines, "", INDEX_REFERENCE, ""].join("\n")
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
			twin(
				"# tx",
				"",
				"> Manage ledger transactions.",
				"",
				"`traj tx` manages ledger transactions.",
			),
		)
	})

	test("ends with a reference to the Docs index, so a twin read alone can find the rest", () => {
		expect(buildMarkdownTwin(PAGE, ORIGIN)).toContain(`[Docs index](${ORIGIN}/docs/llms.txt)`)
	})

	test("makes an internal link absolute and leaves an external one untouched", () => {
		const built = buildMarkdownTwin(
			{
				...PAGE,
				body: "[Commands](/docs/cli/commands/) and [npm](https://www.npmjs.com/package/x).",
			},
			ORIGIN,
		)
		expect(built).toBe(
			twin(
				"# tx",
				"",
				"> Manage ledger transactions.",
				"",
				"[Commands](https://trajectonomics.com/docs/cli/commands/) and [npm](https://www.npmjs.com/package/x).",
			),
		)
	})

	test("keeps a page without a description to its title and body", () => {
		expect(buildMarkdownTwin({ title: "tx", body: "Body." }, ORIGIN)).toBe(
			twin("# tx", "", "Body."),
		)
	})

	test("a body carrying a JSX component has no faithful twin and is refused as JSX_BODY", () => {
		expect(errorCodeOf({ ...PAGE, body: "<Callout>Heads up</Callout>" })).toBe("JSX_BODY")
		expect(errorCodeOf({ ...PAGE, body: '<div className="x">Body.</div>' })).toBe("JSX_BODY")
	})

	test("a JSX-looking tag quoted in a fence or inline code is body text, not a component", () => {
		expect(
			buildMarkdownTwin({ ...PAGE, body: "```tsx\n<Callout>Body.</Callout>\n```" }, ORIGIN),
		).toBe(
			twin(
				"# tx",
				"",
				"> Manage ledger transactions.",
				"",
				"```tsx\n<Callout>Body.</Callout>\n```",
			),
		)
		expect(buildMarkdownTwin({ ...PAGE, body: "Write `<Callout>` for a callout." }, ORIGIN)).toBe(
			twin("# tx", "", "> Manage ledger transactions.", "", "Write `<Callout>` for a callout."),
		)
	})
})
