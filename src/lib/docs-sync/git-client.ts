import type { DocChange, DraftPullRequest } from "./types"

/** The branch to create, and the branch it is created from. */
export interface CreateBranchInput {
	readonly branch: string
	readonly base: string
}

/** The staged proposal: files plus the message that commits them. */
export interface CommitProposalInput {
	readonly branch: string
	readonly message: string
	readonly files: readonly DocChange[]
}

/** The draft pull request to open, or to update when one is already open for the branch. */
export interface OpenDraftPullRequestInput {
	readonly branch: string
	readonly title: string
	readonly body: string
}

/** Everything Docs Sync does to git and GitHub; each call refuses a branch that is not sync's. */
export interface SyncGitClient {
	createBranch(input: CreateBranchInput): Promise<void>
	commit(input: CommitProposalInput): Promise<{ readonly commitSha: string }>
	openOrUpdateDraftPullRequest(input: OpenDraftPullRequestInput): Promise<DraftPullRequest>
}
