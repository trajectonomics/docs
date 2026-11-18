import { describe, expect, test } from "bun:test"
import type { ContentFile } from "./content-pages"
import { checkOperatorExamples, type OperatorExampleProblem } from "./operator-examples"

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

/** One page carrying `block` as its fenced bash block, and the problems the rule reports on it. */
function problemsOf(path: string, block: string): readonly OperatorExampleProblem[] {
	return checkOperatorExamples([{ path, content: `# Example\n\n\`\`\`bash\n${block}\n\`\`\`\n` }])
}

/** The problems an Operator page built from `block` reports, and the rules they break. */
function operatorProblems(block: string): readonly OperatorExampleProblem[] {
	return problemsOf("cli/example.mdx", block)
}

function operatorRules(block: string): readonly string[] {
	return operatorProblems(block).map((problem) => problem.rule)
}

function operatorDetails(block: string): readonly string[] {
	return operatorProblems(block).map((problem) => problem.detail)
}

const OPENING = "traj tx add --opening --from Opening --to Cash --amount -25.00 --date 2026-01-01"
const CREATE = "traj account add Opening --type equity --currency THB"

describe("an --opening example in the Operator tab", () => {
	test("the authored pages create the equity account their opening balance posts against", () => {
		expect(checkOperatorExamples(tree)).toEqual([])
	})

	test("is reported, naming the page and the account, when the page never creates the account", () => {
		expect(operatorProblems(OPENING)).toEqual([
			{
				rule: "opening-account",
				file: "cli/example.mdx",
				detail:
					"an --opening example posts against Opening, which the page does not create as an equity account",
			},
		])
	})

	test("is accepted when the page creates that account as equity before the example", () => {
		expect(operatorProblems(`${CREATE}\n${OPENING}`)).toEqual([])
	})

	test("is reported when the page creates the account only after the example", () => {
		expect(operatorRules(`${OPENING}\n${CREATE}`)).toEqual(["opening-account"])
	})

	test("is reported when the page creates the account with another type", () => {
		expect(
			operatorRules(`traj account add Opening --type asset --currency THB\n${OPENING}`),
		).toEqual(["opening-account"])
	})

	test("is accepted when the account is quoted and the flags are in any order", () => {
		expect(
			operatorRules(
				'traj account add "Opening" --currency THB --type equity\ntraj tx add --to Cash --amount 1000.00 --date 2026-01-01 --from Opening --opening',
			),
		).toEqual([])
	})

	test("is reported from an amend, which posts the same transaction shape", () => {
		expect(
			operatorRules(
				"traj tx amend 0194a000-0003-7000-8000-000000000003 --opening --from Opening --to Cash --amount 1000.00 --date 2026-01-01",
			),
		).toEqual(["opening-account"])
	})

	test("is not read from a page outside the Operator tab", () => {
		expect(problemsOf("developers/example.mdx", OPENING)).toEqual([])
	})

	test("is not read from prose, which the rule cannot copy from", () => {
		const page: ContentFile = {
			path: "cli/example.mdx",
			content: `Run \`${OPENING}\` to start a ledger.\n`,
		}
		expect(checkOperatorExamples([page])).toEqual([])
	})

	test("is not read from a line that continues onto the next", () => {
		expect(
			operatorDetails(
				"traj tx add --opening --from Opening \\\n  --to Cash --amount -25.00 --date 2026-01-01",
			),
		).toEqual([])
	})

	test("a trailing comment in the example is not read as part of the command", () => {
		expect(
			operatorRules(`${CREATE}  # The equity account\n${OPENING}  # Open an overdrawn asset.`),
		).toEqual([])
	})
})
