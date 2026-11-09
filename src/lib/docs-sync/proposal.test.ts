import { describe, expect, test } from "bun:test"
import { resolvePackageTarget } from "./package-map"
import { createProposalSynthesizer } from "./proposal"
import type { PackageTarget, PortalFile, UpstreamRelease } from "./types"

const CLI = resolvePackageTarget("trajectonomics/cli")
const SIM_CORE = resolvePackageTarget("trajectonomics/sim-core")
const RELEASE_URL = "https://github.com/trajectonomics/cli/releases/tag/v0.2.0"
const CLI_PAGE = `---
title: CLI & Quickstart
---

Install and run the Trajectonomics CLI.
`
const CHANGELOG = `## v0.2.0

### Added

- \`ledger accounts\` lists accounts

### Deprecated

- \`ledger post --force\`
`
const RELEASE: UpstreamRelease = {
	repository: "trajectonomics/cli",
	tag: "v0.2.0",
	commitSha: "a1b2c3d",
	documentationPaths: [],
	changelog: CHANGELOG,
}

async function propose(
	target: PackageTarget,
	existingDocs: readonly PortalFile[],
	release: UpstreamRelease = RELEASE,
) {
	return createProposalSynthesizer().synthesize({ target, release, existingDocs })
}

describe("documentation proposal", () => {
	test("a release proposes its notes on the page the package already has", async () => {
		const changes = await propose(CLI, [
			{ path: "src/content/docs/cli/index.mdx", content: CLI_PAGE },
		])
		expect(changes).toHaveLength(1)
		expect(changes[0]?.path).toBe("src/content/docs/cli/index.mdx")
		expect(changes[0]?.action).toBe("update")
		expect(changes[0]?.content).toContain(CLI_PAGE)
		expect(changes[0]?.content).toContain("## Latest release: v0.2.0")
		expect(changes[0]?.content).toContain(`[the v0.2.0 release](${RELEASE_URL})`)
	})

	test("the first release of a core engine creates its page and the folder metadata", async () => {
		const changes = await propose(SIM_CORE, [])
		expect(changes.map((change) => change.path)).toEqual([
			"src/content/docs/developers/sim-core/index.mdx",
			"src/content/docs/developers/sim-core/meta.json",
		])
		expect(changes.map((change) => change.action)).toEqual(["create", "create"])
		expect(changes[0]?.content).toStartWith("---\ntitle: sim-core release notes\n")
		expect(changes[1]?.content).toBe('{\n\t"title": "sim-core",\n\t"pages": ["index"]\n}\n')
	})

	test("a release entry the authored docs already cover is not repeated", async () => {
		const documented: PortalFile = {
			path: "src/content/docs/cli/index.mdx",
			content: `${CLI_PAGE}\n\`ledger accounts\` lists accounts.\n`,
		}
		const content = (await propose(CLI, [documented]))[0]?.content ?? ""
		expect(content).not.toContain("### Added")
		expect(content).toContain("### Deprecated")
		expect(content).toContain("## Latest release: v0.2.0")
	})

	test("an upstream ADR in the release notes is linked at GitHub, not copied", async () => {
		const release = {
			...RELEASE,
			changelog: "### Changed\n\n- Balances follow [ADR 0004](../adr/0004-balance.md).\n",
		}
		const content = (await propose(CLI, [], release))[0]?.content ?? ""
		expect(content).toContain(
			"https://github.com/trajectonomics/cli/blob/v0.2.0/docs/adr/0004-balance.md",
		)
		expect(content).not.toContain("](../adr/")
	})

	test("a release whose notes are already proposed proposes nothing", async () => {
		const first = await propose(CLI, [
			{ path: "src/content/docs/cli/index.mdx", content: CLI_PAGE },
		])
		const page = first[0]?.content ?? ""
		const again = await propose(CLI, [{ path: "src/content/docs/cli/index.mdx", content: page }])
		expect(again).toEqual([])
	})

	test("the release link is canonical even when the dispatch names the package bare", async () => {
		const content = (await propose(CLI, [], { ...RELEASE, repository: "cli" }))[0]?.content ?? ""
		expect(content).toContain(RELEASE_URL)
	})
})
