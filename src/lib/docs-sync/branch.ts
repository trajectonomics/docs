import { DocsSyncError } from "./errors"
import type { UpstreamPackageName } from "./types"

/** The branch the Docs Portal deploys from; Docs Sync never writes it. */
export const MAIN_BRANCH = "main"

/** Every branch Docs Sync writes starts with this prefix, so one glob finds them all. */
export const SYNC_BRANCH_PREFIX = "docs-sync/"

/** A tag that git accepts as a ref component: no `..`, no spaces, no trailing dot or `.lock`. */
const REF_SAFE_TAG = /^(?!.*\.\.)[0-9A-Za-z][0-9A-Za-z._-]{0,63}$/

/** The isolated branch a package's release proposes its edits on, e.g. `docs-sync/cli/v0.1.0`. */
export function syncBranchName(upstreamPackage: UpstreamPackageName, tag: string): string {
	const unsafe = !REF_SAFE_TAG.test(tag) || tag.endsWith(".") || tag.endsWith(".lock")
	if (unsafe) {
		throw new DocsSyncError(
			"BRANCH_NAME_INVALID",
			`tag ${JSON.stringify(tag)} cannot be part of a branch name`,
			"tag",
		)
	}
	return `${SYNC_BRANCH_PREFIX}${upstreamPackage}/${tag}`
}

/**
 * Refuse any branch that is not a Docs Sync branch. Every git write passes through this, so a
 * caller cannot aim the pipeline at the default branch.
 */
export function assertSyncBranch(branch: string): void {
	if (branch === MAIN_BRANCH || branch === `refs/heads/${MAIN_BRANCH}`) {
		throw new DocsSyncError(
			"PROTECTED_BRANCH",
			`Docs Sync never writes ${MAIN_BRANCH}; it only proposes on ${SYNC_BRANCH_PREFIX}<package>/<tag>`,
			"branch",
		)
	}
	if (!branch.startsWith(SYNC_BRANCH_PREFIX) || branch.length === SYNC_BRANCH_PREFIX.length) {
		throw new DocsSyncError(
			"BRANCH_NAME_INVALID",
			`${JSON.stringify(branch)} is not a Docs Sync branch`,
			"branch",
		)
	}
}
