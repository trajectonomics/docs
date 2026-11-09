import type { DocsSyncDeps } from "../../src/lib/docs-sync/deps"
import { DocsSyncError } from "../../src/lib/docs-sync/errors"
import { createProposalSynthesizer } from "../../src/lib/docs-sync/proposal"
import { createConsoleLogger } from "./console-logger"
import { createDocsFileStore } from "./docs-files"
import { createGithubApi } from "./github-api"
import { createGithubGitClient } from "./github-git"
import { createGithubPullRequestOpener } from "./github-pull-request"
import { createGithubUpstreamReader } from "./github-upstream"
import { createFileManifestStore } from "./manifest-file"

/** The repository the docs live in; a workflow checkout sets `GITHUB_REPOSITORY` to it. */
const DEFAULT_REPOSITORY = "trajectonomics/docs"

function required(env: Readonly<Record<string, string | undefined>>, name: string): string {
	const value = env[name]
	if (value === undefined || value.trim().length === 0) {
		throw new DocsSyncError("CONFIG_MISSING", `${name} is not set`, name)
	}
	return value
}

/** Assemble Docs Sync over the real GitHub API, git and filesystem of a workflow checkout. */
export function createLiveDeps(env: Readonly<Record<string, string | undefined>>): DocsSyncDeps {
	const token = required(env, "GITHUB_TOKEN")
	const repository = env["GITHUB_REPOSITORY"] ?? DEFAULT_REPOSITORY
	const repoRoot = process.cwd()
	const api = createGithubApi({ token })
	const git = createGithubGitClient({ repoRoot })
	return {
		manifestStore: createFileManifestStore(repoRoot),
		upstreamReader: createGithubUpstreamReader(api),
		docsContentStore: createDocsFileStore(repoRoot),
		proposalSynthesizer: createProposalSynthesizer(),
		gitClient: {
			createBranch: git.createBranch,
			commit: git.commit,
			openOrUpdateDraftPullRequest: createGithubPullRequestOpener({ api, repository }),
		},
		logger: createConsoleLogger(),
		now: () => new Date().toISOString(),
	}
}
