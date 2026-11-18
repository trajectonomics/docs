import {
	type CommandReferenceProblem,
	problemKey,
	type ReleaseSnapshot,
} from "../../src/lib/command-reference"

/** `1 problem`, `2 problems`: the summary reads as a sentence. */
function count(count: number, noun: string): string {
	return `${count} ${noun}${count === 1 ? "" : "s"}`
}

/** One problem as the line a maintainer reads: the page, then what disagrees with the release. */
function line(problem: CommandReferenceProblem, suffix = ""): string {
	return `${problem.file}: ${problem.detail}${suffix}`
}

/** Print every problem and a summary naming the release; 0 is clean, 1 is drift. */
export function reportAll(
	problems: readonly CommandReferenceProblem[],
	release: ReleaseSnapshot,
	print: (line: string) => void,
): number {
	for (const problem of problems) print(line(problem))
	const summary = problems.length === 0 ? "no problems" : count(problems.length, "problem")
	print(`check:command-reference: ${summary} against traj ${release.version}`)
	return problems.length === 0 ? 0 : 1
}

/** Print only the drift the baseline does not have; a known drift is named and does not fail. */
export function reportNew(
	problems: readonly CommandReferenceProblem[],
	baselineProblems: readonly CommandReferenceProblem[],
	baseline: string,
	release: ReleaseSnapshot,
	print: (line: string) => void,
): number {
	const known = new Set(baselineProblems.map(problemKey))
	const existing = problems.filter((problem) => known.has(problemKey(problem)))
	const introduced = problems.filter((problem) => !known.has(problemKey(problem)))
	for (const problem of existing) {
		print(line(problem, ` — already drifted on ${baseline} (not failing)`))
	}
	for (const problem of introduced) print(line(problem))
	const summary =
		introduced.length === 0 ? "no new problems" : count(introduced.length, "new problem")
	const knownNote =
		existing.length === 0 ? "" : ` (${count(existing.length, "problem")} already drifted)`
	print(`check:command-reference: ${summary} against traj ${release.version}${knownNote}`)
	return introduced.length === 0 ? 0 : 1
}
