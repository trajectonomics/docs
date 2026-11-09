import type { SyncLogger } from "../../src/lib/docs-sync/deps"
import { describeError } from "../../src/lib/docs-sync/errors"

function suffix(fields: Readonly<Record<string, string>> | undefined): string {
	return fields === undefined ? "" : ` ${JSON.stringify(fields)}`
}

/** Log one line per event, prefixed so a workflow log is easy to scan. */
export function createConsoleLogger(): SyncLogger {
	return {
		info(message: string, fields?: Readonly<Record<string, string>>): void {
			console.log(`docs-sync: ${message}${suffix(fields)}`)
		},
		error(message: string, fields?: Readonly<Record<string, string>>): void {
			console.error(`docs-sync: ${message}${suffix(fields)}`)
		},
	}
}

/** Report a failure that stopped the run before Docs Sync itself was reached. */
export function reportStartupFailure(error: unknown): void {
	console.error(`docs-sync: could not start: ${describeError(error)}`)
}
