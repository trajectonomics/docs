import type { SyncManifestStore } from "../../src/lib/docs-sync/deps"
import type { SyncManifest } from "../../src/lib/docs-sync/manifest"
import {
	EMPTY_SYNC_MANIFEST,
	parseSyncManifest,
	SYNC_MANIFEST_PATH,
} from "../../src/lib/docs-sync/manifest"

/**
 * Read the tracked manifest from the checkout. A repository that has never run Docs Sync has no
 * manifest yet, which is the same as an empty one.
 */
export function createFileManifestStore(repoRoot: string): SyncManifestStore {
	return {
		async read(): Promise<SyncManifest> {
			const file = Bun.file(`${repoRoot}/${SYNC_MANIFEST_PATH}`)
			return (await file.exists()) ? parseSyncManifest(await file.text()) : EMPTY_SYNC_MANIFEST
		},
	}
}
