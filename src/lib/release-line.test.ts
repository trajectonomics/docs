import { describe, expect, test } from "bun:test"
import { parseSyncManifest, type SyncManifest } from "./docs-sync/manifest"
import { ReleaseLineError, releaseLine } from "./release-line"

/** A manifest whose only synced package is `cli`, at the given tag, or none without one. */
function manifest(lastSyncedTag?: string): SyncManifest {
	const packages =
		lastSyncedTag === undefined
			? {}
			: { cli: { lastSyncedTag, lastSyncedAt: "2026-01-01T00:00:00.000Z" } }
	return parseSyncManifest(JSON.stringify({ version: 1, packages }))
}

/** The code of the error `releaseLine` refuses the manifest with, or `undefined` when it passes. */
function errorCodeOf(input: SyncManifest): string | undefined {
	try {
		releaseLine(input)
		return undefined
	} catch (error) {
		return error instanceof ReleaseLineError ? error.code : "not-a-release-line-error"
	}
}

describe("the Landing Page's release line", () => {
	test("names the cli tag the sync manifest records", () => {
		expect(releaseLine(manifest("v0.2.0"))).toBe("Docs synced from traj v0.2.0")
	})

	test("names a prerelease tag as the manifest records it", () => {
		expect(releaseLine(manifest("v0.3.0-rc.1"))).toBe("Docs synced from traj v0.3.0-rc.1")
	})

	test("is refused as CLI_ENTRY_MISSING when the manifest has no cli entry", () => {
		expect(errorCodeOf(manifest())).toBe("CLI_ENTRY_MISSING")
	})

	test("is refused as RELEASE_TAG_INVALID when the cli tag is not a release tag", () => {
		expect(errorCodeOf(manifest("latest"))).toBe("RELEASE_TAG_INVALID")
	})
})
