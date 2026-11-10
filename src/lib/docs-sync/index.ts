/** The public surface of Docs Sync: one entry point, its dependencies and its vocabulary. */

export { assertSyncBranch, MAIN_BRANCH, SYNC_BRANCH_PREFIX, syncBranchName } from "./branch"
export type {
	DocsContentStore,
	DocsSyncDeps,
	SyncLogger,
	SyncManifestStore,
	UpstreamReader,
} from "./deps"
export { runDocsSync } from "./engine"
export type { DocsSyncErrorCode } from "./errors"
export { DocsSyncError } from "./errors"
export type {
	CommitProposalInput,
	CreateBranchInput,
	OpenDraftPullRequestInput,
	SyncGitClient,
} from "./git-client"
export type { SyncManifest, SyncManifestEntry } from "./manifest"
export { EMPTY_SYNC_MANIFEST, SYNC_MANIFEST_PATH } from "./manifest"
export { resolvePackageTarget, SUPPORTED_UPSTREAM_PACKAGES } from "./package-map"
export type { ProposalInput, ProposalSynthesizer } from "./proposal"
export { createProposalSynthesizer } from "./proposal"
export type {
	DocChange,
	DraftPullRequest,
	PackageTarget,
	PortalFile,
	SyncResult,
	TabAudience,
	UpstreamPackageName,
	UpstreamRelease,
} from "./types"
