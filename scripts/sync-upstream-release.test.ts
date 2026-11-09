import { afterEach, describe, expect, test } from "bun:test"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { DocsSyncDeps, SyncLogger } from "../src/lib/docs-sync/deps"
import type {
	CommitProposalInput,
	OpenDraftPullRequestInput,
} from "../src/lib/docs-sync/git-client"
import { EMPTY_SYNC_MANIFEST } from "../src/lib/docs-sync/manifest"
import { createProposalSynthesizer } from "../src/lib/docs-sync/proposal"
import type { UpstreamRelease } from "../src/lib/docs-sync/types"
import { main } from "./sync-upstream-release"

const RELEASE: UpstreamRelease = {
	repository: "trajectonomics/cli",
	tag: "v0.2.0",
	commitSha: "a1b2c3d4",
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

interface Recorded {
	readonly deps: DocsSyncDeps
	readonly branches: string[]
	readonly commits: CommitProposalInput[]
	readonly pullRequests: OpenDraftPullRequestInput[]
	readonly messages: string[]
	readonly errors: string[]
}

/** The whole pipeline over in-memory network and git, and the real proposal synthesizer. */
function pipeline(upstream: UpstreamRelease | Error = RELEASE): Recorded {
	const branches: string[] = []
	const commits: CommitProposalInput[] = []
	const pullRequests: OpenDraftPullRequestInput[] = []
	const messages: string[] = []
	const errors: string[] = []
	const logger: SyncLogger = {
		info(message, fields): void {
			messages.push(fields === undefined ? message : `${message} ${JSON.stringify(fields)}`)
		},
		error(message, fields): void {
			errors.push(fields === undefined ? message : `${message} ${JSON.stringify(fields)}`)
		},
	}
	const deps: DocsSyncDeps = {
		manifestStore: { read: async () => EMPTY_SYNC_MANIFEST },
		upstreamReader: {
			readAtTag: async () => {
				if (upstream instanceof Error) {
					throw upstream
				}
				return upstream
			},
		},
		docsContentStore: {
			list: async () => [{ path: "src/content/docs/cli/index.mdx", content: CLI_PAGE }],
		},
		proposalSynthesizer: createProposalSynthesizer(),
		gitClient: {
			createBranch: async (input) => {
				branches.push(input.branch)
			},
			commit: async (input) => {
				commits.push(input)
				return { commitSha: "feedface" }
			},
			openOrUpdateDraftPullRequest: async (input) => {
				pullRequests.push(input)
				return { number: 42, url: "https://github.com/trajectonomics/docs/pull/42" }
			},
		},
		logger,
		now: () => "2026-03-01T00:00:00.000Z",
	}
	return { deps, branches, commits, pullRequests, messages, errors }
}

describe("sync-upstream-release CLI", () => {
	test("a dispatched release runs the whole pipeline and exits successfully", async () => {
		const fake = pipeline()
		const eventPath = await dispatchEvent({
			repo: "trajectonomics/cli",
			tag: "v0.2.0",
			changelog: RELEASE.changelog,
		})

		const code = await main({ env: { GITHUB_EVENT_PATH: eventPath }, deps: fake.deps })

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
		const eventPath = await dispatchEvent({
			repo: "trajectonomics/cli",
			tag: "v0.2.0",
			changelog: RELEASE.changelog,
		})
		await main({ env: { GITHUB_EVENT_PATH: eventPath }, deps: fake.deps })

		const files = fake.commits[0]?.files ?? []
		expect(files[0]?.content).toContain("## Latest release: v0.2.0")
		expect(files[0]?.content).toContain(CLI_PAGE)
		expect(files[1]?.content).toContain('"lastSyncedTag": "v0.2.0"')
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
		const eventPath = await dispatchEvent({
			repo: "trajectonomics/cli",
			tag: "v0.2.0",
			changelog: "x",
		})
		const code = await main({ env: { GITHUB_EVENT_PATH: eventPath }, deps: fake.deps })

		expect(code).toBe(1)
		expect(fake.errors.join("\n")).toContain("UPSTREAM_READ_FAILED")
		expect(fake.pullRequests).toEqual([])
	})

	test("a malformed dispatch payload exits non-zero without writing anything", async () => {
		const fake = pipeline()
		const eventPath = await dispatchEvent({ tag: "v0.2.0" })
		const code = await main({ env: { GITHUB_EVENT_PATH: eventPath }, deps: fake.deps })

		expect(code).toBe(1)
		expect(fake.errors.join("\n")).toContain("PAYLOAD_FIELD_MISSING")
		expect(fake.commits).toEqual([])
	})
})
