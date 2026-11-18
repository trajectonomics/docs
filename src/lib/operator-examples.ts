import type { ContentFile } from "./content-pages"
import { type ContentSubcommand, subcommandsIn } from "./content-subcommands"
import { OPERATOR_TAB_CONTENT } from "./release-truth"

/** One rule of the operator-examples check; one value per way an Operator page can break it. */
export type OperatorExampleRule = "opening-account"

/** An `--opening` example whose page never creates the equity account it posts against. */
export interface OperatorExampleProblem {
	readonly rule: OperatorExampleRule
	readonly file: string
	readonly detail: string
}

/** The equity account a command creates, when it is `traj account add <name> --type equity`. */
function createdEquityAccount(command: ContentSubcommand): string | undefined {
	if (command.group !== "account" || command.leaf !== "add") return undefined
	return command.flags.get("type") === "equity" ? command.positionals[0] : undefined
}

/** The account an `--opening` example posts against, when the command is an opening balance. */
function openingAccount(command: ContentSubcommand): string | undefined {
	if (command.group !== "tx" || (command.leaf !== "add" && command.leaf !== "amend"))
		return undefined
	if (command.flags.get("opening") !== true) return undefined
	const from = command.flags.get("from")
	return typeof from === "string" ? from : undefined
}

function pageProblems(file: ContentFile): readonly OperatorExampleProblem[] {
	if (!file.path.startsWith(`${OPERATOR_TAB_CONTENT}/`)) return []
	const problems: OperatorExampleProblem[] = []
	const equity = new Set<string>()
	for (const command of subcommandsIn(file.content)) {
		const created = createdEquityAccount(command)
		if (created !== undefined) equity.add(created)
		const account = openingAccount(command)
		if (account === undefined || equity.has(account)) continue
		const detail = `an --opening example posts against ${account}, which the page does not create as an equity account`
		problems.push({ rule: "opening-account", file: file.path, detail })
	}
	return problems
}

/** Every `--opening` example whose Operator page never creates the equity account it posts against. */
export function checkOperatorExamples(
	files: readonly ContentFile[],
): readonly OperatorExampleProblem[] {
	return files.flatMap(pageProblems)
}
