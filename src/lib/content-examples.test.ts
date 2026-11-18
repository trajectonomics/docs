import { describe, expect, test } from "bun:test"
import {
	type ContentExamplesProblem,
	type ContentExamplesRule,
	checkContentExamples,
} from "./content-examples"
import { CONTENT_ROOT, type ContentFile } from "./content-pages"

const SCENARIO_PAGE = "cli/commands/scenario.mdx"
const SIM_CORE_PAGE = "developers/sim-core/index.mdx"

async function readContentTree(): Promise<ContentFile[]> {
	const files: ContentFile[] = []
	const glob = new Bun.Glob("**/*.{md,mdx,json}")
	for await (const path of glob.scan({ cwd: CONTENT_ROOT })) {
		files.push({ path, content: await Bun.file(`${CONTENT_ROOT}/${path}`).text() })
	}
	return files.sort((left, right) => left.path.localeCompare(right.path))
}

const tree = await readContentTree()

/** A document the check accepts: every route and target names a declared Account. */
const DOCUMENT = {
	schemaVersion: 4,
	currency: "THB",
	economy: { inflation: 0 },
	accounts: [{ id: "cash", kind: "asset", rate: 0 }],
	flows: [
		{
			id: "salary",
			kind: "income",
			earned: true,
			amount: 100_000,
			frequency: "monthly",
			start: "2026-01-01",
			growth: "inflation",
		},
	],
	cashflow: { surplus: [{ account: "cash" }], contribute: [], withdraw: [] },
}

function scenarioPage(document: unknown): ContentFile[] {
	const block = JSON.stringify(document, null, 2)
	return [{ path: SCENARIO_PAGE, content: `# scenario\n\n\`\`\`json\n${block}\n\`\`\`\n` }]
}

function builderPage(program: string): ContentFile[] {
	return [{ path: SIM_CORE_PAGE, content: `# sim-core\n\n\`\`\`ts\n${program}\n\`\`\`\n` }]
}

function rulesOf(files: readonly ContentFile[]): readonly ContentExamplesRule[] {
	return checkContentExamples(files).map((problem) => problem.rule)
}

function problemsOf(files: readonly ContentFile[]): readonly ContentExamplesProblem[] {
	return checkContentExamples(files)
}

function detailsOf(files: readonly ContentFile[]): readonly string[] {
	return problemsOf(files).map((problem) => problem.detail)
}

describe("the authored content's examples", () => {
	test("the Scenario page's document and the Builder example are both complete", () => {
		expect(checkContentExamples(tree)).toEqual([])
	})
})

describe("the Scenario document", () => {
	test("is reported when the page has no json fence", () => {
		const page: ContentFile[] = [{ path: SCENARIO_PAGE, content: "# scenario\n" }]
		expect(rulesOf(page)).toEqual(["scenario-document-missing"])
		expect(detailsOf(page)).toEqual([
			"no json fence qualifies as a Scenario document; it needs schemaVersion, currency, economy, accounts, flows, cashflow",
		])
	})

	test("is reported as absent when no json fence parses as an object", () => {
		const page: ContentFile[] = [
			{
				path: SCENARIO_PAGE,
				content: "# scenario\n\n```json\n[]\n```\n\n```json\nnot json\n```\n",
			},
		]
		expect(rulesOf(page)).toEqual(["scenario-document-missing"])
		expect(detailsOf(page)).toEqual([
			"no json fence qualifies as a Scenario document; it needs schemaVersion, currency, economy, accounts, flows, cashflow",
		])
	})

	test("is reported as incomplete when a json fence carries none of the required keys", () => {
		const page = scenarioPage({})
		expect(rulesOf(page)).toEqual(["scenario-document-missing"])
		expect(detailsOf(page)).toEqual([
			"the Scenario document omits schemaVersion, currency, economy, accounts, flows, cashflow",
		])
	})

	test("is reported when the document omits a key the CLI requires", () => {
		const { cashflow: omitted, ...withoutCashflow } = DOCUMENT
		const page = scenarioPage(withoutCashflow)
		expect(rulesOf(page)).toEqual(["scenario-document-missing"])
		expect(detailsOf(page)).toEqual(["the Scenario document omits cashflow"])
	})

	test("names the keys the first incomplete fence omits when no fence is complete", () => {
		const page: ContentFile[] = [
			{
				path: SCENARIO_PAGE,
				content: `# scenario\n\n\`\`\`json\n{"currency": "THB"}\n\`\`\`\n\n\`\`\`json\n{"flows": []}\n\`\`\`\n`,
			},
		]
		expect(detailsOf(page)).toEqual([
			"the Scenario document omits schemaVersion, economy, accounts, flows, cashflow",
		])
	})

	test("is accepted when a complete document follows an incomplete json fence", () => {
		const page: ContentFile[] = [
			{
				path: SCENARIO_PAGE,
				content: `# scenario\n\n\`\`\`json\n{}\n\`\`\`\n\n\`\`\`json\n${JSON.stringify(DOCUMENT)}\n\`\`\`\n`,
			},
		]
		expect(problemsOf(page)).toEqual([])
	})

	test("is reported when a route names an Account the document does not declare", () => {
		const dangling = {
			...DOCUMENT,
			cashflow: { ...DOCUMENT.cashflow, withdraw: ["brokerage"] },
		}
		expect(rulesOf(scenarioPage(dangling))).toEqual(["scenario-document-dangling-account"])
	})

	test("is reported when surplus routes to an Account the document does not declare", () => {
		const dangling = {
			...DOCUMENT,
			cashflow: { ...DOCUMENT.cashflow, surplus: [{ account: "brokerage" }] },
		}
		expect(rulesOf(scenarioPage(dangling))).toEqual(["scenario-document-dangling-account"])
	})

	test("is reported when a contribution targets an Account the document does not declare", () => {
		const dangling = {
			...DOCUMENT,
			flows: [
				{
					id: "pension",
					kind: "contribution",
					amount: 50_000,
					frequency: "monthly",
					start: "2026-01-01",
					growth: "inflation",
					target: "pension",
				},
			],
		}
		expect(rulesOf(scenarioPage(dangling))).toEqual(["scenario-document-dangling-account"])
	})

	test("is accepted when every route and target names a declared Account", () => {
		expect(rulesOf(scenarioPage(DOCUMENT))).toEqual([])
	})
})

describe("the Builder example", () => {
	test("is reported when an argument is an identifier the fence does not declare", () => {
		const program = [
			"const scenario = { schemaVersion: 1 }",
			"const timeline = { start: '2026-01-01' }",
			"const result = project(baseline, scenario, timeline)",
		].join("\n")
		expect(rulesOf(builderPage(program))).toEqual(["sim-core-example-undefined-input"])
	})

	test("is accepted when every argument is an inline literal", () => {
		const program = "const result = project({ schemaVersion: 1 }, { schemaVersion: 1 }, {})"
		expect(rulesOf(builderPage(program))).toEqual([])
	})

	test("is accepted when an inline literal holds a comma inside a string", () => {
		const program = 'const result = project({ currency: "THB", schemaVersion: 1 }, {}, {})'
		expect(rulesOf(builderPage(program))).toEqual([])
	})

	test("is accepted when every argument is declared in the same fence", () => {
		const program = [
			"const baseline = { schemaVersion: 1 }",
			"let scenario = { schemaVersion: 1 }",
			"var timeline = { start: '2026-01-01' }",
			"const result = project(baseline, scenario, timeline)",
		].join("\n")
		expect(rulesOf(builderPage(program))).toEqual([])
	})

	test("is reported once for each undefined argument of one call", () => {
		const program = "const result = project(baseline, { schemaVersion: 1 }, horizon)"
		expect(rulesOf(builderPage(program))).toEqual([
			"sim-core-example-undefined-input",
			"sim-core-example-undefined-input",
		])
	})

	test("is not checked outside the Builder tab", () => {
		const operatorPage: ContentFile[] = [
			{
				path: "cli/commands/account.mdx",
				content: "```ts\nproject(baseline, scenario, timeline)\n```\n",
			},
		]
		expect(rulesOf(operatorPage)).toEqual([])
	})
})
