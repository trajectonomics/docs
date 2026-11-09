import { describe, expect, test } from "bun:test"
import { runDocsSync } from "./engine"
import { DocsSyncError } from "./errors"
import { createFakeDeps, FAKE_EVENT } from "./fakes"
import { parseSyncManifest } from "./manifest"

const MANIFEST = parseSyncManifest(
	'{"version":1,"packages":{"cli":{"lastSyncedTag":"v0.1.0","lastSyncedAt":"2026-01-01T00:00:00.000Z"}}}',
)

async function refusalOf(event: unknown, release?: Error): Promise<DocsSyncError> {
	const fake = createFakeDeps(release === undefined ? {} : { release })
	try {
		await runDocsSync(event, fake.deps)
	} catch (error) {
		if (error instanceof DocsSyncError) {
			expect(fake.calls.some((call) => call.startsWith("git."))).toBe(false)
			expect(fake.commits).toEqual([])
			return error
		}
		throw error
	}
	throw new Error("expected Docs Sync to refuse the event")
}

describe("Docs Sync failures", () => {
	test("a malformed payload is refused before anything is read", async () => {
		expect(await refusalOf({ tag: "v0.2.0", changelog: "- x" })).toMatchObject({
			code: "PAYLOAD_FIELD_MISSING",
			field: "repo",
		})
		expect(await refusalOf("upstream_release")).toMatchObject({ code: "PAYLOAD_NOT_OBJECT" })
	})

	test("a repository that is not an Upstream Package is refused with no manifest change", async () => {
		const refusal = await refusalOf({ ...FAKE_EVENT, repo: "trajectonomics/infra" })
		expect(refusal.code).toBe("PACKAGE_UNSUPPORTED")
	})

	test("a tag that upstream does not have aborts without committing a proposal", async () => {
		const missing = new DocsSyncError("UPSTREAM_TAG_NOT_FOUND", "no tag v0.2.0 in cli")
		expect(await refusalOf(FAKE_EVENT, missing)).toMatchObject({
			code: "UPSTREAM_TAG_NOT_FOUND",
		})
	})

	test("a read that fails for any other reason is reported as an upstream read failure", async () => {
		const refusal = await refusalOf(FAKE_EVENT, new Error("connect ECONNREFUSED"))
		expect(refusal.code).toBe("UPSTREAM_READ_FAILED")
		expect(refusal.message).toContain("ECONNREFUSED")
	})

	test("a failed read logs why, so a CI run is diagnosable", async () => {
		const fake = createFakeDeps({ release: new Error("connect ECONNREFUSED") })
		await runDocsSync(FAKE_EVENT, fake.deps).catch(() => undefined)
		expect(fake.errors).toHaveLength(1)
		expect(fake.errors[0]).toContain("trajectonomics/cli")
	})

	test("a refused event leaves the tracked manifest where it was", async () => {
		const fake = createFakeDeps({ manifest: MANIFEST, release: new Error("boom") })
		await runDocsSync(FAKE_EVENT, fake.deps).catch(() => undefined)
		expect(fake.calls).not.toContain("git.commit:docs-sync/cli/v0.2.0")
		expect(fake.pullRequests).toEqual([])
	})
})
