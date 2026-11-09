import { describe, expect, test } from "bun:test"
import { DocsSyncError } from "./errors"
import {
	EMPTY_SYNC_MANIFEST,
	isAlreadySynced,
	manifestEntry,
	parseSyncManifest,
	SYNC_MANIFEST_PATH,
	serializeSyncManifest,
	withSyncedPackage,
} from "./manifest"

const TRACKED_MANIFEST = `{
	"version": 1,
	"packages": {
		"cli": { "lastSyncedTag": "v0.1.0", "lastSyncedAt": "2026-01-01T00:00:00.000Z", "prNumber": 7 }
	}
}`

function refusalOf(text: string): DocsSyncError {
	try {
		parseSyncManifest(text)
	} catch (error) {
		if (error instanceof DocsSyncError) {
			return error
		}
		throw error
	}
	throw new Error("expected the manifest to be refused")
}

describe("sync manifest", () => {
	test("the tracked manifest is docs-sync-manifest.json at the repository root", () => {
		expect(SYNC_MANIFEST_PATH).toBe("docs-sync-manifest.json")
		expect(EMPTY_SYNC_MANIFEST).toEqual({ version: 1, packages: {} })
	})

	test("it records the last tag synced per Upstream Package", () => {
		expect(parseSyncManifest(TRACKED_MANIFEST)).toEqual({
			version: 1,
			packages: {
				cli: {
					lastSyncedTag: "v0.1.0",
					lastSyncedAt: "2026-01-01T00:00:00.000Z",
					prNumber: 7,
				},
			},
		})
	})

	test("it is written the way Biome formats JSON files, so a proposal passes the check", () => {
		expect(serializeSyncManifest(EMPTY_SYNC_MANIFEST)).toBe(
			'{\n\t"version": 1,\n\t"packages": {}\n}\n',
		)
		expect(serializeSyncManifest(parseSyncManifest(TRACKED_MANIFEST))).toStartWith(
			'{\n\t"version": 1,\n\t"packages": {\n\t\t"cli": {\n\t\t\t"lastSyncedTag": "v0.1.0"',
		)
		expect(parseSyncManifest(serializeSyncManifest(parseSyncManifest(TRACKED_MANIFEST)))).toEqual(
			parseSyncManifest(TRACKED_MANIFEST),
		)
	})

	test("a tag already recorded for the package is an idempotent skip", () => {
		const manifest = parseSyncManifest(TRACKED_MANIFEST)
		expect(isAlreadySynced(manifestEntry(manifest, "cli"), "v0.1.0")).toBe(true)
		expect(isAlreadySynced(manifestEntry(manifest, "cli"), "v0.2.0")).toBe(false)
		expect(isAlreadySynced(manifestEntry(manifest, "sim-core"), "v0.1.0")).toBe(false)
	})

	test("recording a sync returns a new frozen manifest and never mutates its input", () => {
		const before = parseSyncManifest(TRACKED_MANIFEST)
		const after = withSyncedPackage(before, "cli", {
			lastSyncedTag: "v0.2.0",
			lastSyncedAt: "2026-02-02T00:00:00.000Z",
		})
		expect(manifestEntry(before, "cli")?.lastSyncedTag).toBe("v0.1.0")
		expect(manifestEntry(after, "cli")).toEqual({
			lastSyncedTag: "v0.2.0",
			lastSyncedAt: "2026-02-02T00:00:00.000Z",
		})
		expect(Object.isFrozen(after)).toBe(true)
	})

	test("a manifest outside the schema is refused, naming the path that is wrong", () => {
		expect(refusalOf("{")).toMatchObject({ code: "MANIFEST_INVALID" })
		expect(refusalOf('{"version":2,"packages":{}}')).toMatchObject({
			code: "MANIFEST_INVALID",
			field: "version",
		})
		expect(refusalOf('{"version":1,"packages":{"docs":{}}}')).toMatchObject({
			code: "MANIFEST_INVALID",
			field: "packages.docs",
		})
		expect(refusalOf('{"version":1,"packages":{"cli":{"lastSyncedAt":"2026"}}}')).toMatchObject({
			code: "MANIFEST_INVALID",
			field: "packages.cli.lastSyncedTag",
		})
	})
})
