import { describe, expect, test } from "bun:test"
import { readContentTree } from "./content-tree-support"
import { parseSyncManifest } from "./docs-sync/manifest"
import { checkReleaseTruth } from "./release-truth"

const MANIFEST_PATH = "docs-sync-manifest.json"

const tree = await readContentTree()
const manifest = parseSyncManifest(await Bun.file(MANIFEST_PATH).text())

/** A manifest the release tests pin, so a later release bump does not rewrite their expectations. */
const FIXTURE = parseSyncManifest(
	JSON.stringify({
		version: 1,
		packages: {
			cli: { lastSyncedTag: "v0.2.0", lastSyncedAt: "2026-01-01T00:00:00.000Z" },
			"sim-core": { lastSyncedTag: "v0.1.0", lastSyncedAt: "2026-01-01T00:00:00.000Z" },
		},
	}),
)

/** The rules a single page breaks, so a test names the rule rather than its wording. */
function rulesOf(path: string, content: string): readonly string[] {
	return checkReleaseTruth([{ path, content }], FIXTURE).map((problem) => problem.rule)
}

/** The details a single page's problems report, so a test can read what a maintainer will see. */
function detailsOf(path: string, content: string): readonly string[] {
	return checkReleaseTruth([{ path, content }], FIXTURE).map((problem) => problem.detail)
}

function cliPage(content: string): readonly string[] {
	return rulesOf("cli/example.mdx", content)
}

function builderPage(content: string): readonly string[] {
	return rulesOf("developers/sim-core/example.mdx", content)
}

describe("release truth in the Docs Portal content", () => {
	test("the authored content names only the release the sync manifest records", () => {
		expect(checkReleaseTruth(tree, manifest)).toEqual([])
	})

	test("a problem names the release the page wrote and the release the manifest records", () => {
		expect(detailsOf("cli/example.mdx", "The latest release is `v0.3.0`.")).toEqual([
			"names v0.3.0, but the manifest records cli v0.2.0",
		])
	})
})

describe("a version the Operator tab names", () => {
	test("is reported when it is not the cli release the manifest records", () => {
		expect(cliPage("The latest release is `v0.3.0`.")).toEqual(["operator-tab-version"])
	})

	test("is accepted when it is the cli release the manifest records", () => {
		expect(cliPage("The latest release is `v0.2.0`.")).toEqual([])
	})

	test("is reported when a pinned npm spec names another release", () => {
		expect(cliPage("npx @trajectonomics/cli@0.3.0 --version")).toEqual(["cli-pin"])
	})

	test("is accepted when the npm spec is unpinned", () => {
		expect(cliPage("npx @trajectonomics/cli@latest --version")).toEqual([])
	})

	test("is reported when a pinned install script names another release", () => {
		expect(cliPage("TRAJ_VERSION=0.3.0 sh")).toEqual(["cli-pin"])
	})
})

describe("an upstream link in any tab", () => {
	test("is reported when it names another release of that package", () => {
		expect(
			builderPage(
				"[ADR 0005](https://github.com/trajectonomics/sim-core/blob/v0.3.0/docs/adr/0005.md)",
			),
		).toEqual(["upstream-link"])
	})

	test("is accepted when it names the manifest's release of that package", () => {
		expect(
			builderPage(
				"[ADR 0005](https://github.com/trajectonomics/sim-core/blob/v0.1.0/docs/adr/0005.md)",
			),
		).toEqual([])
	})

	test("is not checked for a repository the manifest does not track", () => {
		expect(
			builderPage(
				"[ADR 0005](https://github.com/trajectonomics/factory/blob/main/docs/adr/0005.md)",
			),
		).toEqual([])
	})
})
