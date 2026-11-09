import { assertSyncBranch, MAIN_BRANCH, syncBranchName } from "./branch"
import type { DocsSyncDeps } from "./deps"
import type { SyncManifest } from "./manifest"
import { SYNC_MANIFEST_PATH, serializeSyncManifest, withSyncedPackage } from "./manifest"
import { renderDraftPullRequestBody } from "./pr-body"
import type { DocChange, PackageTarget, SyncResult, UpstreamRelease } from "./types"

/** Everything the proposal needs once the release has been read and validated. */
export interface WriteProposalInput {
	readonly deps: DocsSyncDeps
	readonly target: PackageTarget
	readonly release: UpstreamRelease
	readonly changes: readonly DocChange[]
	readonly manifest: SyncManifest
	/** The tag the manifest recorded before this proposal, if the package was ever synced. */
	readonly previousTag: string | undefined
}

/** `docs: sync cli v0.2.0`: the pull request title, and the commit subject it is squashed to. */
function titleOf(target: PackageTarget, tag: string): string {
	return `docs: sync ${target.upstreamPackage} ${tag}`
}

/** The tracked manifest as a staged file, so merging the proposal records the tag atomically. */
function manifestChange(manifest: SyncManifest): DocChange {
	return {
		path: SYNC_MANIFEST_PATH,
		action: "update",
		content: serializeSyncManifest(manifest),
	}
}

/**
 * Stage the proposal on its own branch and open, or update, the draft pull request. The branch
 * is derived from the package and tag, so it can never be the default branch.
 */
export async function writeProposal(input: WriteProposalInput): Promise<SyncResult> {
	const { deps, target, release, previousTag } = input
	const syncedAt = deps.now()
	const files: readonly DocChange[] = [
		...input.changes,
		manifestChange(
			withSyncedPackage(input.manifest, target.upstreamPackage, {
				lastSyncedTag: release.tag,
				lastSyncedAt: syncedAt,
			}),
		),
	]
	const branch = syncBranchName(target.upstreamPackage, release.tag)
	assertSyncBranch(branch)
	await deps.gitClient.createBranch({ branch, base: MAIN_BRANCH })
	const { commitSha } = await deps.gitClient.commit({
		branch,
		message: titleOf(target, release.tag),
		files,
	})
	const pullRequest = await deps.gitClient.openOrUpdateDraftPullRequest({
		branch,
		title: titleOf(target, release.tag),
		body: renderDraftPullRequestBody({ target, release, changes: files, previousTag }),
	})
	await deps.gitClient.commit({
		branch,
		message: `chore: record pull request #${pullRequest.number} for ${release.tag}`,
		files: [
			manifestChange(
				withSyncedPackage(input.manifest, target.upstreamPackage, {
					lastSyncedTag: release.tag,
					lastSyncedAt: syncedAt,
					prNumber: pullRequest.number,
				}),
			),
		],
	})
	deps.logger.info("opened a draft pull request", {
		upstreamPackage: target.upstreamPackage,
		tag: release.tag,
		branch,
		commitSha,
		pullRequest: String(pullRequest.number),
	})
	return {
		status: "proposed",
		upstreamPackage: target.upstreamPackage,
		tag: release.tag,
		branch,
		files: files.map((file) => file.path),
		pullRequest,
	}
}
