import type { DocsSyncDeps } from "./deps"
import { DocsSyncError, describeError } from "./errors"
import { isAlreadySynced, manifestEntry } from "./manifest"
import { resolvePackageTarget } from "./package-map"
import { parseUpstreamReleasePayload } from "./payload"
import type { PackageTarget, SyncResult, UpstreamRelease } from "./types"
import { upstreamRepository } from "./upstream-urls"
import { writeProposal } from "./write-proposal"

/** A skip, logged so a CI run says why it did nothing. */
function skip(
	deps: DocsSyncDeps,
	target: PackageTarget,
	tag: string,
	reason: "already-synced" | "no-changes",
	message: string,
): SyncResult {
	deps.logger.info(message, { upstreamPackage: target.upstreamPackage, tag })
	return { status: "skipped", upstreamPackage: target.upstreamPackage, tag, reason }
}

/** Read the release at its tag, turning a transport failure into a code the caller can act on. */
async function readRelease(
	deps: DocsSyncDeps,
	repository: string,
	tag: string,
): Promise<UpstreamRelease> {
	try {
		return await deps.upstreamReader.readAtTag({ repository, tag })
	} catch (error) {
		deps.logger.error(`could not read ${repository} at ${tag}`, { reason: describeError(error) })
		if (error instanceof DocsSyncError) {
			throw error
		}
		throw new DocsSyncError(
			"UPSTREAM_READ_FAILED",
			`could not read ${repository} at ${tag}: ${describeError(error)}`,
		)
	}
}

/**
 * Run Docs Sync for one `upstream_release` event: validate it, skip what is already synced,
 * propose the docs edits and open or update the draft pull request. Nothing is ever written to
 * the default branch, and the manifest only advances inside the proposal.
 */
export async function runDocsSync(event: unknown, deps: DocsSyncDeps): Promise<SyncResult> {
	const payload = parseUpstreamReleasePayload(event)
	const target = resolvePackageTarget(payload.repository)
	const manifest = await deps.manifestStore.read()
	const previous = manifestEntry(manifest, target.upstreamPackage)
	if (isAlreadySynced(previous, payload.tag)) {
		return skip(deps, target, payload.tag, "already-synced", "already synced, nothing to propose")
	}
	const repository = upstreamRepository(target.upstreamPackage)
	const release = await readRelease(deps, repository, payload.tag)
	const existingDocs = await deps.docsContentStore.list(target.contentDir)
	const changes = await deps.proposalSynthesizer.synthesize({ target, release, existingDocs })
	if (changes.length === 0) {
		return skip(deps, target, release.tag, "no-changes", "the release proposes no change")
	}
	return writeProposal({
		deps,
		target,
		release,
		changes,
		manifest,
		previousTag: previous?.lastSyncedTag,
	})
}
