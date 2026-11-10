import { afterEach, describe, expect, test } from "bun:test"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { FakeDepsRecord } from "../src/lib/docs-sync/fakes"
import { createFakeDeps } from "../src/lib/docs-sync/fakes"
import { createProposalSynthesizer } from "../src/lib/docs-sync/proposal"
import type { UpstreamRelease } from "../src/lib/docs-sync/types"
import { main } from "./sync-upstream-release"

const RELEASE: UpstreamRelease = {
	repository: "trajectonomics/cli",
	tag: "v0.2.0",
	commitSha: "a1b2c3d4",
	documentationPaths: ["docs/quickstart.md"],
	changelog: `## v0.2.0

### Added

- \`ledger accounts\` lists accounts
`,
}

const CLI_PAGE = `---
title: CLI & Quickstart
---

Install and run the Trajectonomics CLI.
`

const DIRECTORIES: string[] = []

afterEach(async () => {
	await Promise.all(DIRECTORIES.splice(0).map((directory) => rm(directory, { recursive: true })))
})

/** A `repository_dispatch` event on disk, the way GitHub delivers it. */
async function dispatchEvent(payload: Readonly<Record<string, string>>): Promise<string> {
	const directory = await mkdtemp(join(tmpdir(), "docs-sync-"))
	DIRECTORIES.push(directory)
	const path = join(directory, "event.json")
	await writeFile(path, JSON.stringify({ action: "upstream_release", client_payload: payload }))
	return path
}

/** The whole pipeline over in-memory network and git, and the real proposal synthesizer. */
function pipeline(upstream: UpstreamRelease | Error = RELEASE): FakeDepsRecord {
	return createFakeDeps({
		release: upstream,
		docs: [{ path: "src/content/docs/cli/index.mdx", content: CLI_PAGE }],
		proposalSynthesizer: createProposalSynthesizer(),
	})
}

const DISPATCH = { repo: "trajectonomics/cli", tag: "v0.2.0", changelog: RELEASE.changelog }

describe("sync-upstream-release CLI", () => {
	test("a dispatched release runs the whole pipeline and exits successfully", async () => {
		const fake = pipeline()
		const code = await main({
			env: { GITHUB_EVENT_PATH: await dispatchEvent(DISPATCH) },
			deps: fake.deps,
		})

		expect(code).toBe(0)
		expect(fake.branches).toEqual(["docs-sync/cli/v0.2.0"])
		expect(fake.commits[0]?.files.map((file) => file.path)).toEqual([
			"src/content/docs/cli/index.mdx",
			"docs-sync-manifest.json",
		])
		expect(fake.pullRequests[0]?.title).toBe("docs: sync cli v0.2.0")
		expect(fake.messages.join("\n")).toContain("docs-sync/cli/v0.2.0")
	})

	test("the proposed page and manifest are the ones the branch would carry", async () => {
		const fake = pipeline()
		await main({ env: { GITHUB_EVENT_PATH: await dispatchEvent(DISPATCH) }, deps: fake.deps })

		const files = fake.commits[0]?.files ?? []
		expect(files[0]?.content).toContain("## Latest release: v0.2.0")
		expect(files[0]?.content).toContain("`ledger accounts` lists accounts")
		expect(files[0]?.content).toContain(CLI_PAGE)
		expect(files[1]?.content).toContain('"lastSyncedTag": "v0.2.0"')
		expect(fake.commits[1]?.files[0]?.content).toContain('"prNumber": 42')
	})

	test("with no event path there is nothing to run, and it fails loudly", async () => {
		const fake = pipeline()
		const code = await main({ env: {}, deps: fake.deps })

		expect(code).toBe(1)
		expect(fake.errors.join("\n")).toContain("GITHUB_EVENT_PATH")
		expect(fake.commits).toEqual([])
	})

	test("an upstream failure exits non-zero with the error code in the report", async () => {
		const fake = pipeline(new Error("connect ECONNREFUSED"))
		const code = await main({
			env: { GITHUB_EVENT_PATH: await dispatchEvent(DISPATCH) },
			deps: fake.deps,
		})

		expect(code).toBe(1)
		expect(fake.errors.join("\n")).toContain("UPSTREAM_READ_FAILED")
		expect(fake.pullRequests).toEqual([])
	})

	test("a malformed dispatch payload exits non-zero without writing anything", async () => {
		const fake = pipeline()
		const code = await main({
			env: { GITHUB_EVENT_PATH: await dispatchEvent({ tag: "v0.2.0" }) },
			deps: fake.deps,
		})

		expect(code).toBe(1)
		expect(fake.errors.join("\n")).toContain("PAYLOAD_FIELD_MISSING")
		expect(fake.commits).toEqual([])
	})
})
