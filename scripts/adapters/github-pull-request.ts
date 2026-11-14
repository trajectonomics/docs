import { DocsSyncError } from "../../src/lib/docs-sync/errors"
import type { OpenDraftPullRequestInput } from "../../src/lib/docs-sync/git-client"
import type { DraftPullRequest } from "../../src/lib/docs-sync/types"
import type { GithubApi } from "./github-api"
import { fieldOf, stringAt } from "./github-api"

/** The base branch a proposal is opened against; merging to it deploys the staging Worker only. */
const BASE_BRANCH = "main"

function pullRequestOf(body: unknown): DraftPullRequest | null {
	const number = fieldOf(body, "number")
	const url = stringAt(body, "html_url")
	return typeof number === "number" && url !== undefined ? { number, url } : null
}

function refusal(status: number, text: string): DocsSyncError {
	return new DocsSyncError(
		"PULL_REQUEST_FAILED",
		`GitHub refused the draft pull request: ${status} ${text}`,
	)
}

/** The draft already open for this branch, if a revision is being proposed. */
async function openFor(
	api: GithubApi,
	repository: string,
	head: string,
): Promise<DraftPullRequest | undefined> {
	const response = await api.request({ path: `/repos/${repository}/pulls?state=open&head=${head}` })
	const body = response.ok ? response.body : []
	const found = (Array.isArray(body) ? body : []).map(pullRequestOf)
	return found.find((pullRequest): pullRequest is DraftPullRequest => pullRequest !== null)
}

async function revise(
	api: GithubApi,
	repository: string,
	existing: DraftPullRequest,
	input: OpenDraftPullRequestInput,
): Promise<DraftPullRequest> {
	const response = await api.request({
		method: "PATCH",
		path: `/repos/${repository}/pulls/${existing.number}`,
		body: { title: input.title, body: input.body },
	})
	if (!response.ok) {
		throw refusal(response.status, response.text)
	}
	return existing
}

async function create(
	api: GithubApi,
	repository: string,
	input: OpenDraftPullRequestInput,
): Promise<DraftPullRequest> {
	const response = await api.request({
		method: "POST",
		path: `/repos/${repository}/pulls`,
		body: {
			title: input.title,
			body: input.body,
			head: input.branch,
			base: BASE_BRANCH,
			draft: true,
		},
	})
	if (!response.ok) {
		throw refusal(response.status, response.text)
	}
	const pullRequest = pullRequestOf(response.body)
	if (pullRequest === null) {
		throw new DocsSyncError("PULL_REQUEST_FAILED", "GitHub answered without a pull request number")
	}
	return pullRequest
}

/**
 * Open a draft pull request for the branch, or update the draft already open for it, so a
 * revised release proposal never creates a second pull request.
 */
export function createGithubPullRequestOpener(options: {
	readonly api: GithubApi
	readonly repository: string
}): (input: OpenDraftPullRequestInput) => Promise<DraftPullRequest> {
	const { api, repository } = options
	const owner = repository.split("/")[0] ?? repository
	return async function openOrUpdateDraftPullRequest(
		input: OpenDraftPullRequestInput,
	): Promise<DraftPullRequest> {
		const head = encodeURIComponent(`${owner}:${input.branch}`)
		const existing = await openFor(api, repository, head)
		return existing === undefined
			? create(api, repository, input)
			: revise(api, repository, existing, input)
	}
}
