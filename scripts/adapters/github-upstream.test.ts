import { describe, expect, test } from "bun:test"
import { DocsSyncError } from "../../src/lib/docs-sync/errors"
import type { GithubApi, GithubRequestInput, GithubResponse } from "./github-api"
import { createGithubUpstreamReader } from "./github-upstream"

function fakeApi(route: (path: string) => GithubResponse): {
	readonly api: GithubApi
	readonly paths: string[]
} {
	const paths: string[] = []
	return {
		api: {
			async request(input: GithubRequestInput): Promise<GithubResponse> {
				paths.push(input.path)
				return route(input.path)
			},
		},
		paths,
	}
}

const RELEASE = {
	ok: true,
	body: { name: "v0.2.0", body: "### Added\n\n- `ledger accounts` lists accounts" },
} as const

describe("GitHub upstream reader", () => {
	test("it reads the release notes and the commit the tag points at", async () => {
		const fake = fakeApi((path) =>
			path.endsWith("/commits/v0.2.0") ? { ok: true, body: { sha: "a1b2c3d4" } } : RELEASE,
		)
		const release = await createGithubUpstreamReader(fake.api).readAtTag({
			repository: "trajectonomics/cli",
			tag: "v0.2.0",
		})

		expect(release).toEqual({
			repository: "trajectonomics/cli",
			tag: "v0.2.0",
			commitSha: "a1b2c3d4",
			changelog: "### Added\n\n- `ledger accounts` lists accounts",
		})
		expect(fake.paths).toEqual([
			"/repos/trajectonomics/cli/releases/tags/v0.2.0",
			"/repos/trajectonomics/cli/commits/v0.2.0",
		])
	})

	test("a tag that upstream does not have is reported as a missing tag", async () => {
		const fake = fakeApi(() => ({ ok: false, status: 404, text: "Not Found" }))
		const error = await createGithubUpstreamReader(fake.api)
			.readAtTag({ repository: "trajectonomics/cli", tag: "v9.9.9" })
			.catch((thrown: unknown) => thrown)

		expect(error).toBeInstanceOf(DocsSyncError)
		expect((error as DocsSyncError).code).toBe("UPSTREAM_TAG_NOT_FOUND")
		expect(fake.paths).toHaveLength(1)
	})

	test("a read that fails for another reason is reported as a read failure", async () => {
		const fake = fakeApi(() => ({ ok: false, status: 503, text: "unavailable" }))
		const error = await createGithubUpstreamReader(fake.api)
			.readAtTag({ repository: "trajectonomics/cli", tag: "v0.2.0" })
			.catch((thrown: unknown) => thrown)

		expect((error as DocsSyncError).code).toBe("UPSTREAM_READ_FAILED")
		expect((error as DocsSyncError).message).toContain("503")
	})

	test("a release with no notes still says what was released", async () => {
		const fake = fakeApi((path) =>
			path.endsWith("/commits/v0.2.0")
				? { ok: true, body: { sha: "a1b2c3d4" } }
				: { ok: true, body: { name: "v0.2.0", body: "  " } },
		)
		const release = await createGithubUpstreamReader(fake.api).readAtTag({
			repository: "trajectonomics/cli",
			tag: "v0.2.0",
		})
		expect(release.changelog).toBe("## v0.2.0")
	})
})
