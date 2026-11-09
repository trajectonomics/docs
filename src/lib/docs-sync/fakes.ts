import type { DocsSyncDeps } from "./deps"
import type { CommitProposalInput, OpenDraftPullRequestInput } from "./git-client"
import type { SyncManifest } from "./manifest"
import { EMPTY_SYNC_MANIFEST } from "./manifest"
import type { DocChange, PortalFile, UpstreamRelease } from "./types"

/** A release that is ready to be proposed, for tests that do not need a release of their own. */
export const FAKE_RELEASE: UpstreamRelease = {
	repository: "trajectonomics/cli",
	tag: "v0.2.0",
	commitSha: "a1b2c3d4",
	changelog: "### Added\n\n- `ledger accounts` lists accounts\n",
}

/** A dispatch payload for that release. */
export const FAKE_EVENT: Readonly<Record<string, string>> = {
	repo: "trajectonomics/cli",
	tag: "v0.2.0",
	changelog: FAKE_RELEASE.changelog,
}

/** What an in-memory run recorded, so a test can assert on the effects Docs Sync had. */
export interface FakeDepsRecord {
	readonly deps: DocsSyncDeps
	readonly calls: string[]
	readonly commits: CommitProposalInput[]
	readonly pullRequests: OpenDraftPullRequestInput[]
	readonly upstreamReads: { readonly repository: string; readonly tag: string }[]
	readonly errors: string[]
}

export interface FakeDepsOptions {
	readonly manifest?: SyncManifest
	readonly release?: UpstreamRelease | Error
	readonly docs?: readonly PortalFile[]
	readonly changes?: readonly DocChange[]
	readonly nowIso?: string
}

const DEFAULT_CHANGE: DocChange = {
	path: "src/content/docs/cli/index.mdx",
	action: "update",
	content: "proposed page",
}

/** Docs Sync over in-memory adapters: no network, no filesystem, no clock. */
export function createFakeDeps(options: FakeDepsOptions = {}): FakeDepsRecord {
	const calls: string[] = []
	const commits: CommitProposalInput[] = []
	const pullRequests: OpenDraftPullRequestInput[] = []
	const upstreamReads: { readonly repository: string; readonly tag: string }[] = []
	const errors: string[] = []
	const deps: DocsSyncDeps = {
		manifestStore: {
			async read(): Promise<SyncManifest> {
				calls.push("manifest.read")
				return options.manifest ?? EMPTY_SYNC_MANIFEST
			},
		},
		upstreamReader: {
			async readAtTag(input): Promise<UpstreamRelease> {
				calls.push("upstream.readAtTag")
				upstreamReads.push(input)
				const release = options.release ?? FAKE_RELEASE
				if (release instanceof Error) {
					throw release
				}
				return release
			},
		},
		docsContentStore: {
			async list(): Promise<readonly PortalFile[]> {
				calls.push("docs.list")
				return options.docs ?? []
			},
		},
		proposalSynthesizer: {
			async synthesize(): Promise<readonly DocChange[]> {
				calls.push("proposal.synthesize")
				return options.changes ?? [DEFAULT_CHANGE]
			},
		},
		gitClient: {
			async createBranch(input): Promise<void> {
				calls.push(`git.createBranch:${input.branch}`)
			},
			async commit(input): Promise<{ readonly commitSha: string }> {
				calls.push(`git.commit:${input.branch}`)
				commits.push(input)
				return { commitSha: "feedface" }
			},
			async openOrUpdateDraftPullRequest(input) {
				calls.push("git.openOrUpdateDraftPullRequest")
				pullRequests.push(input)
				return { number: 42, url: "https://github.com/trajectonomics/docs/pull/42" }
			},
		},
		logger: {
			info(): void {},
			error(message: string): void {
				errors.push(message)
			},
		},
		now: (): string => options.nowIso ?? "2026-03-01T00:00:00.000Z",
	}
	return { deps, calls, commits, pullRequests, upstreamReads, errors }
}
