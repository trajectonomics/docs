import { CheckError } from "./errors"

/** The check's arguments: the git ref a pull-request run compares against, when it has one. */
export interface CheckArguments {
	readonly baseline: string | undefined
}

/** Parse the check's arguments; a usage error is refused like any other exit-2 failure. */
export function parseArguments(argv: readonly string[]): CheckArguments {
	if (argv.length === 0) return Object.freeze({ baseline: undefined })
	const [flag, ref, ...rest] = argv
	if (flag === "--baseline" && ref !== undefined && !ref.startsWith("-") && rest.length === 0) {
		return Object.freeze({ baseline: ref })
	}
	throw new CheckError(
		"USAGE_INVALID",
		"usage: bun run check:command-reference [--baseline <git ref>]",
	)
}
