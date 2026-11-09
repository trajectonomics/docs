import { describe, expect, test } from "bun:test"
import { DocsSyncError } from "../../src/lib/docs-sync/errors"
import type { GithubApi, GithubRequestInput, GithubResponse } from "./github-api"
import { createGithubPullRequestOpener } from "./github-pull-request"

const PROPOSAL = { branch: "docs-sync/cli/v0.2.0", title: "docs: sync cli v0.2.0", body: "body" }

function recordingApi(route: (input: GithubRequestInput) => GithubResponse): {
	readonly api: GithubApi
	readonly requests: GithubRequestInput[]
} {
	const requests: GithubRequestInput[] = []
	return {
		api: {
			async request(input: GithubRequestInput): Promise<GithubResponse> {
				requests.push(input)
				return route(input)
			},
		},
		requests,
	}
}

const CREATED = {
	ok: true,
	body: { number: 42, html_url: "https://github.com/trajectonomics/docs/pull/42" },
} as const

describe("GitHub draft pull request", () => {
	test("with no open pull request for the branch it opens a draft against main", async () => {
		const fake = recordingApi((input) =>
			input.method === "POST" ? CREATED : { ok: true, body: [] },
		)
		const pullRequest = await createGithubPullRequestOpener({
			api: fake.api,
			repository: "trajectonomics/docs",
		})(PROPOSAL)

		expect(pullRequest).toEqual({
			number: 42,
			url: "https://github.com/trajectonomics/docs/pull/42",
		})
		const created = fake.requests.find((request) => request.method === "POST")
		expect(created?.body).toMatchObject({
			head: "docs-sync/cli/v0.2.0",
			base: "main",
			draft: true,
			title: "docs: sync cli v0.2.0",
		})
	})

	test("a pull request already open for the branch is updated, not duplicated", async () => {
		const fake = recordingApi((input) =>
			input.method === "PATCH" ? CREATED : { ok: true, body: [CREATED.body] },
		)
		const pullRequest = await createGithubPullRequestOpener({
			api: fake.api,
			repository: "trajectonomics/docs",
		})(PROPOSAL)

		expect(pullRequest.number).toBe(42)
		expect(fake.requests.some((request) => request.method === "POST")).toBe(false)
		expect(fake.requests[1]?.method).toBe("PATCH")
		expect(fake.requests[1]?.path).toContain("/pulls/42")
	})

	test("a refused creation is an error naming what GitHub said", async () => {
		const fake = recordingApi(() => ({ ok: false, status: 422, text: "branch exists" }))
		const error = await createGithubPullRequestOpener({
			api: fake.api,
			repository: "trajectonomics/docs",
		})(PROPOSAL).catch((thrown: unknown) => thrown)

		expect(error).toBeInstanceOf(DocsSyncError)
		expect((error as DocsSyncError).code).toBe("PULL_REQUEST_FAILED")
		expect((error as DocsSyncError).message).toContain("422")
	})
})
