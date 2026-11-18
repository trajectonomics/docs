import { readFileSync } from "node:fs"
import { parseSyncManifest, SYNC_MANIFEST_PATH } from "./docs-sync/manifest"
import { releaseLine } from "./release-line"

/** The Landing Page's release line, read from the tracked sync manifest the page and its twin both state. */
export function trackedReleaseLine(): string {
	return releaseLine(parseSyncManifest(readFileSync(SYNC_MANIFEST_PATH, "utf8")))
}
