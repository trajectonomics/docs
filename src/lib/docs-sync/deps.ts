import type { SyncGitClient } from "./git-client"
import type { SyncManifest } from "./manifest"
import type { ProposalSynthesizer } from "./proposal"
import type { PortalFile, UpstreamRelease } from "./types"

/** Reads the tracked sync manifest; the engine records the update inside the proposal. */
export interface SyncManifestStore {
	read(): Promise<SyncManifest>
}

/** Reads an Upstream Package at the released tag, never at its default branch. */
export interface UpstreamReader {
	readAtTag(input: {
		readonly repository: string
		readonly tag: string
		/** The notes the dispatch carried: they are the changelog Docs Sync proposes from. */
		readonly changelog: string
	}): Promise<UpstreamRelease>
}

/** Reads the Docs Portal files that exist under one Tab folder. */
export interface DocsContentStore {
	list(contentDir: string): Promise<readonly PortalFile[]>
}

/** Where Docs Sync reports what it did, and why it stopped. */
export interface SyncLogger {
	info(message: string, fields?: Readonly<Record<string, string>>): void
	error(message: string, fields?: Readonly<Record<string, string>>): void
}

/** Every external effect Docs Sync needs, injected so the engine itself stays pure. */
export interface DocsSyncDeps {
	readonly manifestStore: SyncManifestStore
	readonly upstreamReader: UpstreamReader
	readonly docsContentStore: DocsContentStore
	readonly proposalSynthesizer: ProposalSynthesizer
	readonly gitClient: SyncGitClient
	readonly logger: SyncLogger
	/** The ISO 8601 timestamp recorded as `lastSyncedAt`; the clock is the caller's. */
	now(): string
}
