import { checkCommandReference } from "../src/lib/command-reference"
import { createCommandReferenceDeps } from "./adapters/command-reference"
import { parseArguments } from "./command-reference/arguments"
import { type CommandReferenceDeps, UnreadableError } from "./command-reference/deps"
import { readRelease } from "./command-reference/release"
import { reportAll, reportNew } from "./command-reference/report"

/** Compare the published CLI with the command reference and return the process exit code. */
export async function main(argv: readonly string[], deps: CommandReferenceDeps): Promise<number> {
	try {
		const { baseline } = parseArguments(argv)
		const release = await readRelease(deps)
		const pages = await deps.pages()
		if (pages === undefined) {
			throw new UnreadableError("the command-reference pages could not be read")
		}
		const problems = checkCommandReference(release, pages)
		if (baseline === undefined) return reportAll(problems, release, deps.print)
		const baselinePages = await deps.pagesAt(baseline)
		if (baselinePages === undefined) {
			throw new UnreadableError(`the command-reference pages at ${baseline} could not be read`)
		}
		const known = checkCommandReference(release, baselinePages)
		return reportNew(problems, known, baseline, release, deps.print)
	} catch (error) {
		if (!(error instanceof UnreadableError)) throw error
		deps.print(`check:command-reference: ${error.message}`)
		return 2
	}
}

if (import.meta.main) {
	process.exitCode = await main(process.argv.slice(2), createCommandReferenceDeps())
}
