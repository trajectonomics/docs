import type { SyncLogger } from "./deps"
import type { CommitProposalInput, OpenDraftPullRequestInput, SyncGitClient } from "./git-client"

/** What the fake git client recorded, shared with the record a caller receives. */
export interface FakeGitRecord {
	readonly calls: string[]
	readonly branches: string[]
	readonly commits: CommitProposalInput[]
	readonly pullRequests: OpenDraftPullRequestInput[]
}

function logLine(message: string, fields?: Readonly<Record<string, string>>): string {
	return fields === undefined ? message : `${message} ${JSON.stringify(fields)}`
}

/** The branch, commit and draft pull request a proposal asked for, recorded instead of made. */
export function createFakeGitClient(record: FakeGitRecord): SyncGitClient {
	return {
		async createBranch(input): Promise<void> {
			record.calls.push(`git.createBranch:${input.branch}`)
			record.branches.push(input.branch)
		},
		async commit(input): Promise<{ readonly commitSha: string }> {
			record.calls.push(`git.commit:${input.branch}`)
			record.commits.push(input)
			return { commitSha: "feedface" }
		},
		async openOrUpdateDraftPullRequest(input) {
			record.calls.push("git.openOrUpdateDraftPullRequest")
			record.pullRequests.push(input)
			return { number: 42, url: "https://github.com/trajectonomics/docs/pull/42" }
		},
	}
}

/** A logger that keeps every line, fields included, so a test can read what a run reported. */
export function createFakeLogger(messages: string[], errors: string[]): SyncLogger {
	return {
		info(message: string, fields?: Readonly<Record<string, string>>): void {
			messages.push(logLine(message, fields))
		},
		error(message: string, fields?: Readonly<Record<string, string>>): void {
			errors.push(logLine(message, fields))
		},
	}
}
