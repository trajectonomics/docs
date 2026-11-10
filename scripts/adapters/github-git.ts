import { mkdir } from "node:fs/promises"
import { dirname } from "node:path"
import { assertSyncBranch } from "../../src/lib/docs-sync/branch"
import { DocsSyncError } from "../../src/lib/docs-sync/errors"
import type {
	CommitProposalInput,
	CreateBranchInput,
	SyncGitClient,
} from "../../src/lib/docs-sync/git-client"

/** The identity a proposal commit is authored with, so it reads as one automated actor. */
const COMMIT_IDENTITY = [
	"-c",
	"user.name=Docs Sync",
	"-c",
	"user.email=docs-sync@trajectonomics.com",
]

function git(repoRoot: string, args: readonly string[]): string {
	const result = Bun.spawnSync(["git", ...args], { cwd: repoRoot, stdout: "pipe", stderr: "pipe" })
	if (result.exitCode !== 0) {
		const reason = result.stderr.toString().trim()
		throw new DocsSyncError("GIT_WRITE_FAILED", `git ${args[0]} failed: ${reason}`)
	}
	return result.stdout.toString().trim()
}

/** Whether the index has nothing to commit, which makes a second write a no-op. */
function isStagedClean(repoRoot: string): boolean {
	const result = Bun.spawnSync(["git", "diff", "--cached", "--quiet"], {
		cwd: repoRoot,
		stdout: "pipe",
		stderr: "pipe",
	})
	return result.exitCode === 0
}

/** `main` when the checkout has it, `origin/main` otherwise; a tag alone is never a base. */
function baseRefOf(repoRoot: string, base: string): string {
	for (const candidate of [base, `origin/${base}`]) {
		const probe = Bun.spawnSync(["git", "rev-parse", "--verify", "--quiet", candidate], {
			cwd: repoRoot,
			stdout: "pipe",
			stderr: "pipe",
		})
		if (probe.exitCode === 0) {
			return candidate
		}
	}
	throw new DocsSyncError(
		"GIT_WRITE_FAILED",
		`the checkout has no ${base} or origin/${base}`,
		"branch",
	)
}

/** The git half of a proposal: a branch off the default branch, and the commit pushed to it. */
export function createGithubGitClient(options: {
	readonly repoRoot: string
}): Pick<SyncGitClient, "createBranch" | "commit"> {
	const { repoRoot } = options
	return {
		async createBranch(input: CreateBranchInput): Promise<void> {
			assertSyncBranch(input.branch)
			git(repoRoot, ["checkout", "--force", "-B", input.branch, baseRefOf(repoRoot, input.base)])
		},
		async commit(input: CommitProposalInput): Promise<{ readonly commitSha: string }> {
			assertSyncBranch(input.branch)
			for (const file of input.files) {
				const path = `${repoRoot}/${file.path}`
				await mkdir(dirname(path), { recursive: true })
				await Bun.write(path, file.content)
			}
			git(repoRoot, ["add", "--", ...input.files.map((file) => file.path)])
			if (isStagedClean(repoRoot)) {
				return { commitSha: git(repoRoot, ["rev-parse", "HEAD"]) }
			}
			git(repoRoot, [...COMMIT_IDENTITY, "commit", "--message", input.message])
			git(repoRoot, ["push", "--force-with-lease", "origin", input.branch])
			return { commitSha: git(repoRoot, ["rev-parse", "HEAD"]) }
		},
	}
}
