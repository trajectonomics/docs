import { describe, expect, test } from "bun:test"
import { runDocsSync } from "./engine"
import { createFakeDeps, FAKE_EVENT, FAKE_RELEASE } from "./fakes"
import { parseSyncManifest } from "./manifest"

const MANIFEST = parseSyncManifest(
	'{"version":1,"packages":{"cli":{"lastSyncedTag":"v0.1.0","lastSyncedAt":"2026-01-01T00:00:00.000Z"}}}',
)

describe("Docs Sync", () => {
	test("a new release proposes its docs and the manifest as a draft pull request", async () => {
		const fake = createFakeDeps({ manifest: MANIFEST })
		const result = await runDocsSync(FAKE_EVENT, fake.deps)

		expect(result.status).toBe("proposed")
		expect(result).toMatchObject({
			upstreamPackage: "cli",
			tag: "v0.2.0",
			branch: "docs-sync/cli/v0.2.0",
			pullRequest: { number: 42 },
		})
		expect(fake.pullRequests).toHaveLength(1)
	})

	test("the proposal is committed on the sync branch, never on the default branch", async () => {
		const fake = createFakeDeps({ manifest: MANIFEST })
		await runDocsSync(FAKE_EVENT, fake.deps)

		expect(fake.calls).toContain("git.createBranch:docs-sync/cli/v0.2.0")
		expect(fake.commits[0]?.branch).toBe("docs-sync/cli/v0.2.0")
		expect(fake.calls).not.toContain("git.commit:main")
	})

	test("the commit stages the docs change and the manifest that records the tag", async () => {
		const fake = createFakeDeps({ manifest: MANIFEST })
		await runDocsSync(FAKE_EVENT, fake.deps)

		const files = fake.commits[0]?.files ?? []
		expect(files.map((file) => file.path)).toEqual([
			"src/content/docs/cli/index.mdx",
			"docs-sync-manifest.json",
		])
		expect(files[1]?.content).toContain('"lastSyncedTag": "v0.2.0"')
		expect(files[1]?.content).toContain('"lastSyncedAt": "2026-03-01T00:00:00.000Z"')
	})

	test("the pull request title is a conventional commit and the body carries the context", async () => {
		const fake = createFakeDeps({ manifest: MANIFEST })
		await runDocsSync(FAKE_EVENT, fake.deps)

		expect(fake.pullRequests[0]?.title).toBe("docs: sync cli v0.2.0")
		expect(fake.pullRequests[0]?.title).toMatch(/^docs: .+/)
		expect(fake.pullRequests[0]?.body).toContain(
			"https://github.com/trajectonomics/cli/releases/tag/v0.2.0",
		)
		expect(fake.pullRequests[0]?.body).toContain("`v0.1.0...v0.2.0`")
	})

	test("a tag the manifest already records is an idempotent skip", async () => {
		const fake = createFakeDeps({
			manifest: parseSyncManifest(
				'{"version":1,"packages":{"cli":{"lastSyncedTag":"v0.2.0","lastSyncedAt":"2026-01-01T00:00:00.000Z"}}}',
			),
		})
		const result = await runDocsSync(FAKE_EVENT, fake.deps)

		expect(result).toEqual({
			status: "skipped",
			upstreamPackage: "cli",
			tag: "v0.2.0",
			reason: "already-synced",
		})
		expect(fake.commits).toEqual([])
		expect(fake.pullRequests).toEqual([])
		expect(fake.calls.some((call) => call.startsWith("git."))).toBe(false)
	})

	test("a release that proposes no change writes no branch and no pull request", async () => {
		const fake = createFakeDeps({ changes: [] })
		const result = await runDocsSync(FAKE_EVENT, fake.deps)

		expect(result).toMatchObject({ status: "skipped", reason: "no-changes" })
		expect(fake.calls.some((call) => call.startsWith("git."))).toBe(false)
	})

	test("the release is read at the released tag, not at the default branch", async () => {
		const fake = createFakeDeps({ release: { ...FAKE_RELEASE, tag: "v9.9.9" } })
		await runDocsSync({ ...FAKE_EVENT, tag: "v9.9.9" }, fake.deps)

		expect(fake.upstreamReads).toEqual([{ repository: "trajectonomics/cli", tag: "v9.9.9" }])
		expect(fake.commits[0]?.branch).toBe("docs-sync/cli/v9.9.9")
	})
})
