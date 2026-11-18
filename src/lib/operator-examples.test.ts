import { describe, expect, test } from "bun:test"
import type { ContentFile } from "./content-pages"
import { checkOperatorExamples } from "./operator-examples"

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

/** An Operator page carrying `block` as its one fenced bash block. */
function operatorPage(block: string): ContentFile[] {
	return [{ path: "cli/example.mdx", content: `# Example\n\n\`\`\`bash\n${block}\n\`\`\`\n` }]
}

/** The details the Operator page's problems report, so a test reads what a maintainer will see. */
function detailsOf(path: string, block: string): readonly string[] {
	return checkOperatorExamples([{ path, content: `\`\`\`bash\n${block}\n\`\`\`\n` }]).map(
		(problem) => problem.detail,
	)
}

function accounts(block: string): readonly string[] {
	return detailsOf("cli/example.mdx", block)
}

const OPENING = "traj tx add --opening --from Opening --to Cash --amount -25.00 --date 2026-01-01"
const CREATE = "traj account add Opening --type equity --currency THB"

describe("an --opening example in the Operator tab", () => {
	test("the authored pages create the equity account their opening balance posts against", () => {
		expect(checkOperatorExamples(tree)).toEqual([])
	})

	test("is reported, naming the page and the account, when the page never creates the account", () => {
		expect(
			checkOperatorExamples(operatorPage(OPENING)).map((problem) => [
				problem.rule,
				problem.file,
				problem.detail,
			]),
		).toEqual([
			[
				"opening-account",
				"cli/example.mdx",
				"an --opening example posts against Opening, which the page does not create as an equity account",
			],
		])
	})

	test("is accepted when the page creates that account as equity before the example", () => {
		expect(accounts(`${CREATE}\n${OPENING}`)).toEqual([])
	})

	test("is reported when the page creates the account only after the example", () => {
		expect(accounts(`${OPENING}\n${CREATE}`)).toHaveLength(1)
	})

	test("is reported when the page creates the account with another type", () => {
		expect(
			accounts(`traj account add Opening --type asset --currency THB\n${OPENING}`),
		).toHaveLength(1)
	})

	test("is accepted when the account is quoted and the flags are in any order", () => {
		expect(
			accounts(
				'traj account add "Opening" --currency THB --type equity\ntraj tx add --to Cash --amount 1000.00 --date 2026-01-01 --from Opening --opening',
			),
		).toEqual([])
	})

	test("is reported from an amend, which posts the same transaction shape", () => {
		expect(
			accounts(
				"traj tx amend 0194a000-0003-7000-8000-000000000003 --opening --from Opening --to Cash --amount 1000.00 --date 2026-01-01",
			),
		).toHaveLength(1)
	})

	test("is not read from a page outside the Operator tab", () => {
		expect(detailsOf("developers/example.mdx", OPENING)).toEqual([])
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
			accounts(
				"traj tx add --opening --from Opening \\\n  --to Cash --amount -25.00 --date 2026-01-01",
			),
		).toEqual([])
	})

	test("a trailing comment in the example is not read as part of the command", () => {
		expect(
			accounts(`${CREATE}  # The equity account\n${OPENING}  # Open an overdrawn asset.`),
		).toEqual([])
	})
})
