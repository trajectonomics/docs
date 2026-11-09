import type { UpstreamReader } from "../../src/lib/docs-sync/deps"
import { DocsSyncError } from "../../src/lib/docs-sync/errors"
import type { UpstreamRelease } from "../../src/lib/docs-sync/types"
import type { GithubApi } from "./github-api"
import { stringAt } from "./github-api"

function versionNotFound(repository: string, tag: string): DocsSyncError {
	return new DocsSyncError(
		"UPSTREAM_TAG_NOT_FOUND",
		`${repository} has no release tagged ${tag}`,
		"tag",
	)
}

function readFailed(repository: string, tag: string, reason: string): DocsSyncError {
	return new DocsSyncError(
		"UPSTREAM_READ_FAILED",
		`could not read ${repository} at ${tag}: ${reason}`,
	)
}

/** The commit a tag points at, so the draft pull request can name it. */
async function commitShaOf(api: GithubApi, repository: string, tag: string): Promise<string> {
	const response = await api.request({ path: `/repos/${repository}/commits/${tag}` })
	if (!response.ok) {
		throw readFailed(repository, tag, `commit lookup answered ${response.status}`)
	}
	const sha = stringAt(response.body, "sha")
	if (sha === undefined) {
		throw readFailed(repository, tag, "the commit has no sha")
	}
	return sha
}

/**
 * Read an Upstream Package at exactly the released tag: the release notes GitHub holds for that
 * tag, and the commit it points at. Nothing is ever read from the default branch.
 */
export function createGithubUpstreamReader(api: GithubApi): UpstreamReader {
	return {
		async readAtTag(input): Promise<UpstreamRelease> {
			const { repository, tag } = input
			const response = await api.request({ path: `/repos/${repository}/releases/tags/${tag}` })
			if (!response.ok) {
				throw response.status === 404
					? versionNotFound(repository, tag)
					: readFailed(repository, tag, `the release answered ${response.status}`)
			}
			const changelog = stringAt(response.body, "body") ?? ""
			const name = stringAt(response.body, "name") ?? tag
			return {
				repository,
				tag,
				commitSha: await commitShaOf(api, repository, tag),
				changelog: changelog.trim().length === 0 ? `## ${name}` : changelog,
			}
		},
	}
}
