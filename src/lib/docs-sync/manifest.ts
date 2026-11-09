import { DocsSyncError } from "./errors"
import { SUPPORTED_UPSTREAM_PACKAGES } from "./package-map"
import type { UpstreamPackageName } from "./types"

/** The tracked file, at the repository root, that records the last tag synced per package. */
export const SYNC_MANIFEST_PATH = "docs-sync-manifest.json"

/** What the docs have been synced to for one Upstream Package. */
export interface SyncManifestEntry {
	readonly lastSyncedTag: string
	readonly lastSyncedAt: string
	/** The draft pull request that proposes this tag, while it is still open. */
	readonly prNumber?: number
}

/** The sync manifest: the last tag synced for every Upstream Package that has been synced. */
export interface SyncManifest {
	readonly version: 1
	readonly packages: Readonly<Partial<Record<UpstreamPackageName, SyncManifestEntry>>>
}

/** A manifest with nothing synced yet, the state of a repository that has never run Docs Sync. */
export const EMPTY_SYNC_MANIFEST: SyncManifest = Object.freeze({
	version: 1,
	packages: Object.freeze({}),
})

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value)
}

function invalid(message: string, field?: string): DocsSyncError {
	return new DocsSyncError("MANIFEST_INVALID", `${SYNC_MANIFEST_PATH}: ${message}`, field)
}

function requireString(entry: Record<string, unknown>, key: string, path: string): string {
	const value = entry[key]
	if (typeof value !== "string" || value.length === 0) {
		throw invalid(`${path} must be a non-empty string`, path)
	}
	return value
}

/** One package entry, refusing a key or field outside the schema. */
function entryOf(name: string, raw: unknown): SyncManifestEntry {
	const path = `packages.${name}`
	if (!SUPPORTED_UPSTREAM_PACKAGES.includes(name as UpstreamPackageName)) {
		throw invalid(`${name} is not an Upstream Package`, path)
	}
	if (!isRecord(raw)) {
		throw invalid(`${path} must be an object`, path)
	}
	const lastSyncedTag = requireString(raw, "lastSyncedTag", `${path}.lastSyncedTag`)
	const lastSyncedAt = requireString(raw, "lastSyncedAt", `${path}.lastSyncedAt`)
	const prNumber = raw["prNumber"]
	if (prNumber === undefined) {
		return { lastSyncedTag, lastSyncedAt }
	}
	if (typeof prNumber !== "number" || !Number.isInteger(prNumber)) {
		throw invalid(`${path}.prNumber must be an integer`, `${path}.prNumber`)
	}
	return { lastSyncedTag, lastSyncedAt, prNumber }
}

/** Read a tracked manifest, refusing anything outside the schema before it is trusted. */
export function parseSyncManifest(text: string): SyncManifest {
	let raw: unknown
	try {
		raw = JSON.parse(text)
	} catch {
		throw invalid("is not valid JSON")
	}
	if (!isRecord(raw) || raw["version"] !== 1) {
		throw invalid("must be an object whose version is 1", "version")
	}
	const rawPackages = raw["packages"]
	if (!isRecord(rawPackages)) {
		throw invalid("packages must be an object", "packages")
	}
	const packages: Record<string, SyncManifestEntry> = {}
	for (const [name, entry] of Object.entries(rawPackages)) {
		packages[name] = entryOf(name, entry)
	}
	return Object.freeze({ version: 1, packages: Object.freeze(packages) })
}

/** The tracked manifest as file text, indented as Biome formats JSON in this repository. */
export function serializeSyncManifest(manifest: SyncManifest): string {
	return `${JSON.stringify(manifest, null, "\t")}\n`
}

/** What the manifest records for one package, or `undefined` if it was never synced. */
export function manifestEntry(
	manifest: SyncManifest,
	upstreamPackage: UpstreamPackageName,
): SyncManifestEntry | undefined {
	return manifest.packages[upstreamPackage]
}

/** Whether this tag was already recorded, which makes a repeated dispatch a skip. */
export function isAlreadySynced(entry: SyncManifestEntry | undefined, tag: string): boolean {
	return entry !== undefined && entry.lastSyncedTag === tag
}

/** A new frozen manifest that records `entry` against `upstreamPackage`; the input is untouched. */
export function withSyncedPackage(
	manifest: SyncManifest,
	upstreamPackage: UpstreamPackageName,
	entry: SyncManifestEntry,
): SyncManifest {
	return Object.freeze({
		version: 1,
		packages: Object.freeze({ ...manifest.packages, [upstreamPackage]: entry }),
	})
}
