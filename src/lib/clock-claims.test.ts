import { describe, expect, test } from "bun:test"
import { checkClockClaims } from "./clock-claims"
import type { ContentFile } from "./content-pages"

const CONTENT_ROOT = "src/content/docs"

async function readContentTree(): Promise<ContentFile[]> {
	const files: ContentFile[] = []
	const glob = new Bun.Glob("**/*.{md,mdx,json}")
	for await (const path of glob.scan({ cwd: CONTENT_ROOT })) {
		files.push({ path, content: await Bun.file(`${CONTENT_ROOT}/${path}`).text() })
	}
	return files.sort((left, right) => left.path.localeCompare(right.path))
}

const tree = await readContentTree()

/** The rules a single page breaks, so a test names the rule rather than its wording. */
function rulesOf(path: string, content: string): readonly string[] {
	return checkClockClaims([{ path, content }]).map((problem) => problem.rule)
}

/** The details a single page's problems report, so a test reads what a maintainer will see. */
function detailsOf(path: string, content: string): readonly string[] {
	return checkClockClaims([{ path, content }]).map((problem) => problem.detail)
}

function operatorPage(content: string): readonly string[] {
	return rulesOf("cli/example.mdx", content)
}

function builderPage(content: string): readonly string[] {
	return rulesOf("developers/sim-core/example.mdx", content)
}

describe("clock claims in the Docs Portal content", () => {
	test("no Operator-tab page claims the CLI has no clock", () => {
		expect(checkClockClaims(tree)).toEqual([])
	})
})

describe("a page that claims the CLI has no clock", () => {
	test("is reported when it says the CLI reads no clock", () => {
		expect(operatorPage("dated by you — the CLI reads no clock (ADR 0018).")).toEqual([
			"reads-no-clock",
		])
	})

	test("is reported when it says it never reads a clock", () => {
		expect(operatorPage("It never reads a clock: the date is yours.")).toEqual([
			"never-reads-a-clock",
		])
	})

	test("is reported when it says it never reads the clock", () => {
		expect(operatorPage("The tool never reads the clock.")).toEqual(["never-reads-the-clock"])
	})

	test("is reported when it says it has no clock", () => {
		expect(operatorPage("The CLI has no clock.")).toEqual(["has-no-clock"])
	})

	test("is reported across a line break and a capital, and the detail names the clause", () => {
		expect(detailsOf("cli/example.mdx", "The CLI Reads no\nclock, writes a timestamp.")).toEqual([
			'claims the CLI has no clock: "Reads no clock"',
		])
	})
})

describe("a page that states which dates the caller supplies", () => {
	test("is accepted when it says the date a command acts on is one you pass", () => {
		expect(
			operatorPage("Every date a command acts on is `YYYY-MM-DD`, and it is always one you pass."),
		).toEqual([])
	})

	test("is accepted in the Builder tab when a package reads no clock", () => {
		expect(builderPage("The package generates no ids and reads no clock.")).toEqual([])
	})

	test("is accepted when a report takes its date from the caller", () => {
		expect(operatorPage("Both reports take their date from you, never from the clock.")).toEqual([])
	})
})
