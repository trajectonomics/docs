/** A Trajectonomics repository whose releases the Docs Portal documents. */
export type UpstreamPackageName = "cli" | "sim-core" | "ledger-core" | "tax-core" | "design-system"

/** The audience a Tab is written for. */
export type TabAudience = "Operator" | "Builder"

/** Where a package's documentation lives and which Tab it belongs to. */
export interface PackageTarget {
	readonly upstreamPackage: UpstreamPackageName
	/** Folder under `src/content/docs/`, e.g. `cli` or `developers/sim-core`. */
	readonly contentDir: string
	readonly audience: TabAudience
}

/** A file Docs Sync stages into the draft pull request, relative to the repository root. */
export interface DocChange {
	readonly path: string
	readonly action: "create" | "update"
	readonly content: string
}

/** A file already tracked in the Docs Portal, read from the branch Docs Sync runs on. */
export interface PortalFile {
	readonly path: string
	readonly content: string
}

/** What the upstream repository published at the released tag. */
export interface UpstreamRelease {
	readonly repository: string
	readonly tag: string
	readonly commitSha: string
	readonly changelog: string
	/** Documentation files that exist in the upstream repository at that tag. */
	readonly documentationPaths: readonly string[]
}

/** An open, or reused, draft pull request that proposes the documentation edits. */
export interface DraftPullRequest {
	readonly number: number
	readonly url: string
}

/** What one run of Docs Sync did, so a caller can report it and exit on it. */
export type SyncResult =
	| {
			readonly status: "proposed"
			readonly upstreamPackage: UpstreamPackageName
			readonly tag: string
			readonly branch: string
			readonly files: readonly string[]
			readonly pullRequest: DraftPullRequest
	  }
	| {
			readonly status: "skipped"
			readonly upstreamPackage: UpstreamPackageName
			readonly tag: string
			readonly reason: "already-synced" | "no-changes"
	  }
