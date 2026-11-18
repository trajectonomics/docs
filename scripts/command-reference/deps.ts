import type { ContentFile } from "../../src/lib/command-reference"

/** One code per way the check can refuse to give a verdict; every one exits 2. */
export type CommandReferenceErrorCode =
	| "USAGE_INVALID"
	| "RELEASE_UNREADABLE"
	| "RELEASE_MALFORMED"
	| "PAGES_UNREADABLE"
	| "BASELINE_UNREADABLE"

/** A failure that makes the check exit 2: the release or the pages cannot be read. */
export class UnreadableError extends Error {
	readonly code: CommandReferenceErrorCode

	constructor(code: CommandReferenceErrorCode, message: string) {
		super(message)
		this.name = "UnreadableError"
		this.code = code
		Object.freeze(this)
	}
}

/** The milliseconds the check waits for npm to serve a release it already announced. */
export const RELEASE_WAIT_MS = 600_000

/** The milliseconds between two attempts to read the release. */
export const RELEASE_POLL_MS = 15_000

/** The side effects the check needs, injected so its exit codes are testable without the network. */
export interface CommandReferenceDeps {
	/** The current time in milliseconds; the bounded wait runs on the caller's clock. */
	now(): number
	/** Wait `ms` milliseconds before trying the release again. */
	sleep(ms: number): Promise<void>
	/** Print one line of the check's report. */
	print(line: string): void
	/** The version npm's `latest` tag names, or undefined while the registry cannot serve it. */
	latestVersion(): Promise<string | undefined>
	/** The JSON a `cli@<version>` call prints, or undefined when the call failed. */
	cliJson(version: string, args: readonly string[]): Promise<unknown>
	/** The text a `cli@<version>` call prints, or undefined when the call failed. */
	cliText(version: string, args: readonly string[]): Promise<string | undefined>
	/** The command-reference pages of the working tree, or undefined when they cannot be read. */
	pages(): Promise<readonly ContentFile[] | undefined>
	/** The command-reference pages at a git ref, or undefined when they cannot be read. */
	pagesAt(ref: string): Promise<readonly ContentFile[] | undefined>
}
