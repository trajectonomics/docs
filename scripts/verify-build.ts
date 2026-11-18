import { existsSync, readFileSync } from "node:fs"
import { checkBuild } from "../src/lib/build"
import { parseSyncManifest, SYNC_MANIFEST_PATH } from "../src/lib/docs-sync/manifest"
import { releaseLine } from "../src/lib/release-line"
import { readBuildFiles } from "./adapters/build-files"

/** The Worker's assets root: Astro builds into `dist/docs`, so the Worker serves `./dist`. */
const BUILD_ROOT = "dist"

/** The release line the built Landing Page must state, read from the tracked sync manifest. */
function expectedReleaseLine(): string {
	return releaseLine(parseSyncManifest(readFileSync(SYNC_MANIFEST_PATH, "utf8")))
}

/** Check the built Docs Portal on disk, returning the process exit code. */
export async function main(root: string): Promise<number> {
	if (!existsSync(root)) {
		console.error(`verify:build: ${root}/ is missing. Run \`bun run build\` first.`)
		return 1
	}
	let line: string
	try {
		line = expectedReleaseLine()
	} catch (error) {
		console.error(`verify:build: ${error instanceof Error ? error.message : String(error)}`)
		return 1
	}
	const failures = checkBuild(await readBuildFiles(root), line)
	for (const failure of failures) {
		console.error(`${failure.code} ${failure.path}: ${failure.message}`)
	}
	if (failures.length > 0) {
		console.error(`verify:build: ${failures.length} failed check(s) in ${root}/`)
		return 1
	}
	console.log("verify:build: ok")
	return 0
}

if (import.meta.main) {
	process.exitCode = await main(BUILD_ROOT)
}
