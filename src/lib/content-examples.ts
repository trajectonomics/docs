import type { ContentFile } from "./content-pages"
import { codeFences } from "./content-programs"
import { undefinedProjectArguments } from "./project-example"
import {
	accountReferences,
	declaredAccounts,
	SCENARIO_DOCUMENT_KEYS,
	scenarioDocument,
} from "./scenario-document"

/** One rule of the example check; one value per way a published example can be incomplete. */
export type ContentExamplesRule =
	| "scenario-document-missing"
	| "scenario-document-dangling-account"
	| "sim-core-example-undefined-input"

/** One page that publishes an incomplete Scenario document or an incomplete Builder example. */
export interface ContentExamplesProblem {
	readonly rule: ContentExamplesRule
	readonly file: string
	readonly detail: string
}

/** The Operator page that documents `traj scenario apply`, its document and its flags. */
const SCENARIO_PAGE = "cli/commands/scenario.mdx"

/** The Builder tab, whose pages publish the example programs the check runs. */
const BUILDER_TAB = "developers/"

/** The fence languages a Builder example is written in. */
const PROGRAM_LANGUAGES = ["ts", "typescript"]

function scenarioProblems(file: ContentFile): readonly ContentExamplesProblem[] {
	const lookup = scenarioDocument(file.content)
	if (lookup.kind !== "document") {
		const detail =
			lookup.kind === "absent"
				? `no json fence qualifies as a Scenario document; it needs ${SCENARIO_DOCUMENT_KEYS.join(", ")}`
				: `the Scenario document omits ${lookup.missing.join(", ")}`
		return [{ rule: "scenario-document-missing", file: file.path, detail }]
	}
	const declared = declaredAccounts(lookup.document)
	return accountReferences(lookup.document).flatMap(({ path, account }) =>
		declared.has(account)
			? []
			: [
					{
						rule: "scenario-document-dangling-account",
						file: file.path,
						detail: `${path} names "${account}", which accounts does not declare`,
					},
				],
	)
}

function programProblems(file: ContentFile): readonly ContentExamplesProblem[] {
	return codeFences(file.content).flatMap((fence) => {
		if (!PROGRAM_LANGUAGES.includes(fence.language)) return []
		return undefinedProjectArguments(fence.body).map(({ call, index, source }) => ({
			rule: "sim-core-example-undefined-input",
			file: file.path,
			detail: `project() call ${call + 1}'s argument ${index + 1} is "${source}", which the fence neither inlines nor declares`,
		}))
	})
}

/** Every way the authored pages publish an incomplete Scenario document or Builder example. */
export function checkContentExamples(
	files: readonly ContentFile[],
): readonly ContentExamplesProblem[] {
	return files.flatMap((file) => {
		if (file.path === SCENARIO_PAGE) return scenarioProblems(file)
		if (file.path.startsWith(BUILDER_TAB)) return programProblems(file)
		return []
	})
}
