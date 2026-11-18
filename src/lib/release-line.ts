import { manifestEntry, SYNC_MANIFEST_PATH, type SyncManifest } from "./docs-sync/manifest"

/** The ways the sync manifest cannot produce the Landing Page's release line; one per rule. */
export type ReleaseLineErrorCode = "CLI_ENTRY_MISSING" | "RELEASE_TAG_INVALID"

/** A sync manifest that cannot produce the Landing Page's release line. */
export class ReleaseLineError extends Error {
	readonly code: ReleaseLineErrorCode
	readonly field: string

	constructor(code: ReleaseLineErrorCode, message: string, field: string) {
		super(message)
		this.name = "ReleaseLineError"
		this.code = code
		this.field = field
		Object.freeze(this)
	}
}

/** A release tag as Docs Sync records it: `v` and a semantic version, prerelease included. */
const RELEASE_TAG = /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?$/

/** The Landing Page's release line for a parsed sync manifest, from the `cli` tag it was synced from. */
export function releaseLine(manifest: SyncManifest): string {
	const entry = manifestEntry(manifest, "cli")
	if (entry === undefined) {
		throw new ReleaseLineError(
			"CLI_ENTRY_MISSING",
			`${SYNC_MANIFEST_PATH}: packages.cli is missing, so the Landing Page has no release line`,
			"packages.cli",
		)
	}
	if (!RELEASE_TAG.test(entry.lastSyncedTag)) {
		throw new ReleaseLineError(
			"RELEASE_TAG_INVALID",
			`${SYNC_MANIFEST_PATH}: packages.cli.lastSyncedTag "${entry.lastSyncedTag}" is not a release tag`,
			"packages.cli.lastSyncedTag",
		)
	}
	return `Docs synced from traj ${entry.lastSyncedTag}`
}
