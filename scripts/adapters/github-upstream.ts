import type { UpstreamReader } from "../../src/lib/docs-sync/deps"
import { DocsSyncError } from "../../src/lib/docs-sync/errors"
import type { UpstreamRelease } from "../../src/lib/docs-sync/types"
import type { GithubApi } from "./github-api"
import { fieldOf, stringAt } from "./github-api"

/** How many upstream documentation paths the proposal carries, to keep the body readable. */
const DOCUMENTATION_LIMIT = 20

/** Documentation an Upstream Package publishes: `docs/**` and its README. */
const DOCUMENTATION_PATH = /^(?:readme\.md|docs?\/.*\.mdx?)$/i

/** A tag the upstream repository does not have, which is a refusal and not a retry. */
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
	if (!response.ok && response.status === 404) {
		throw versionNotFound(repository, tag)
	}
	if (!response.ok) {
		throw readFailed(repository, tag, `commit lookup answered ${response.status}`)
	}
	const sha = stringAt(response.body, "sha")
	if (sha === undefined) {
		throw readFailed(repository, tag, "the commit has no sha")
	}
	return sha
}

function filePathOf(node: unknown): string | undefined {
	return stringAt(node, "type") === "file" ? stringAt(node, "path") : undefined
}

/**
 * The documentation files that exist in the upstream repository at the tag. Their text is never
 * copied: the portal links them, because upstream writes for contributors, not for Operators.
 */
async function documentationPathsOf(
	api: GithubApi,
	repository: string,
	tag: string,
): Promise<readonly string[]> {
	const response = await api.request({
		path: `/repos/${repository}/git/trees/${tag}?recursive=1`,
	})
	if (!response.ok) {
		throw readFailed(repository, tag, `tree lookup answered ${response.status}`)
	}
	const tree = fieldOf(response.body, "tree")
	if (!Array.isArray(tree)) {
		throw readFailed(repository, tag, "the tree listing is missing")
	}
	return tree
		.map(filePathOf)
		.filter((path): path is string => path !== undefined && DOCUMENTATION_PATH.test(path))
		.sort()
		.slice(0, DOCUMENTATION_LIMIT)
}

/**
 * Read an Upstream Package at exactly the released tag: the commit it points at, and the
 * documentation files that exist there. The release notes come from the dispatch, because the
 * payload is the contract cicd publishes; nothing is ever read from the default branch.
 */
export function createGithubUpstreamReader(api: GithubApi): UpstreamReader {
	return {
		async readAtTag(input): Promise<UpstreamRelease> {
			const { repository, tag, changelog } = input
			return {
				repository,
				tag,
				commitSha: await commitShaOf(api, repository, tag),
				changelog,
				documentationPaths: await documentationPathsOf(api, repository, tag),
			}
		},
	}
}
