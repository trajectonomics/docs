import type { ReleaseLeaf, ReleaseSnapshot } from "../../src/lib/command-reference"
import { type CommandReferenceDeps, RELEASE_POLL_MS, RELEASE_WAIT_MS } from "./deps"
import { CheckError } from "./errors"
import { globalFlagsOf, leafFromSchema, leafNamesOf } from "./snapshot"

/** One attempt at the release, or undefined while npm has not served the version's assets yet. */
async function attemptRelease(deps: CommandReferenceDeps): Promise<ReleaseSnapshot | undefined> {
	const version = await deps.latestVersion()
	if (version === undefined) return undefined
	const listed = await deps.cliJson(version, ["schema", "--json"])
	if (listed === undefined) return undefined
	const leaves: ReleaseLeaf[] = []
	for (const name of leafNamesOf(listed)) {
		const schema = await deps.cliJson(version, ["schema", ...name.split(" "), "--json"])
		if (schema === undefined) return undefined
		leaves.push(leafFromSchema(schema, name))
	}
	const first = leaves[0]
	if (first === undefined) {
		throw new CheckError("NO_LEAVES_LISTED", "`schema --json` listed no leaves")
	}
	const help = await deps.cliText(version, ["help", ...first.name.split(" ")])
	if (help === undefined) return undefined
	return Object.freeze({
		version,
		leaves: Object.freeze(leaves),
		globalFlags: Object.freeze(globalFlagsOf(help)),
	})
}

/** The published release, waiting a bounded ten minutes for npm to serve its assets. */
export async function readRelease(deps: CommandReferenceDeps): Promise<ReleaseSnapshot> {
	const deadline = deps.now() + RELEASE_WAIT_MS
	for (;;) {
		const release = await attemptRelease(deps)
		if (release !== undefined) return release
		if (deps.now() >= deadline) {
			throw new CheckError(
				"RELEASE_UNREADABLE",
				`the published CLI did not become readable within ${RELEASE_WAIT_MS / 60_000} minutes`,
			)
		}
		await deps.sleep(RELEASE_POLL_MS)
	}
}
