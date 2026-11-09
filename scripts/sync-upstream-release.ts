import type { DocsSyncDeps } from "../src/lib/docs-sync/deps"
import { runDocsSync } from "../src/lib/docs-sync/engine"
import { DocsSyncError, describeError, errorCodeOf } from "../src/lib/docs-sync/errors"
import type { SyncResult } from "../src/lib/docs-sync/types"
import { reportStartupFailure } from "./adapters/console-logger"
import { createLiveDeps } from "./adapters/live-deps"

/** What the CLI needs: the process environment and every external effect, injected. */
export interface SyncCliOptions {
	readonly env: Readonly<Record<string, string | undefined>>
	readonly deps: DocsSyncDeps
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value)
}

/**
 * The `upstream_release` payload from the event file GitHub writes for a dispatch. A payload
 * read by hand carries no `client_payload` wrapper, so both forms are accepted.
 */
async function readDispatchEvent(env: SyncCliOptions["env"]): Promise<unknown> {
	const path = env["GITHUB_EVENT_PATH"]
	if (path === undefined || path.trim().length === 0) {
		throw new DocsSyncError(
			"CONFIG_MISSING",
			"GITHUB_EVENT_PATH is not set, so there is no dispatch event to read",
			"GITHUB_EVENT_PATH",
		)
	}
	const event: unknown = await Bun.file(path).json()
	return isRecord(event) && "client_payload" in event ? event["client_payload"] : event
}

/** One line saying what the run did, for the job log. */
function reportOf(result: SyncResult): string {
	if (result.status === "skipped") {
		return `skipped ${result.upstreamPackage} ${result.tag} (${result.reason})`
	}
	return `proposed ${result.branch} in pull request #${result.pullRequest.number} (${result.files.length} files)`
}

/** Run one dispatched release, returning the process exit code. */
export async function main(options: SyncCliOptions): Promise<number> {
	const { env, deps } = options
	try {
		const event = await readDispatchEvent(env)
		deps.logger.info(reportOf(await runDocsSync(event, deps)))
		return 0
	} catch (error) {
		deps.logger.error("docs sync failed", {
			code: errorCodeOf(error),
			reason: describeError(error),
		})
		return 1
	}
}

/** Wire the CLI to the environment a workflow hands it; a startup failure is a failed job. */
export async function runFromEnvironment(
	env: Readonly<Record<string, string | undefined>>,
): Promise<number> {
	try {
		return await main({ env, deps: createLiveDeps(env) })
	} catch (error) {
		reportStartupFailure(error)
		return 1
	}
}

if (import.meta.main) {
	process.exitCode = await runFromEnvironment(process.env)
}
