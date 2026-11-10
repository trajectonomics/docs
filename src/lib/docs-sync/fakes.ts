import type { DocsSyncDeps } from "./deps"
import { createFakeGitClient, createFakeLogger, type FakeGitRecord } from "./fake-git"
import type { SyncManifest } from "./manifest"
import { EMPTY_SYNC_MANIFEST } from "./manifest"
import type { ProposalSynthesizer } from "./proposal"
import type { DocChange, PortalFile, UpstreamRelease } from "./types"

/** A release that is ready to be proposed, for tests that do not need a release of their own. */
export const FAKE_RELEASE: UpstreamRelease = {
	repository: "trajectonomics/cli",
	tag: "v0.2.0",
	commitSha: "a1b2c3d4",
	changelog: "### Added\n\n- `ledger accounts` lists accounts\n",
	documentationPaths: [],
}

/** A dispatch payload for that release. */
export const FAKE_EVENT: Readonly<Record<string, string>> = {
	repo: "trajectonomics/cli",
	tag: "v0.2.0",
	changelog: FAKE_RELEASE.changelog,
}

/** What an in-memory run recorded, so a test can assert on the effects Docs Sync had. */
export interface FakeDepsRecord extends FakeGitRecord {
	readonly deps: DocsSyncDeps
	readonly upstreamReads: readonly { readonly repository: string; readonly tag: string }[]
	readonly messages: readonly string[]
	readonly errors: readonly string[]
}

export interface FakeDepsOptions {
	readonly manifest?: SyncManifest
	readonly release?: UpstreamRelease | Error
	readonly docs?: readonly PortalFile[]
	readonly changes?: readonly DocChange[]
	readonly proposalSynthesizer?: ProposalSynthesizer
	readonly nowIso?: string
}

const DEFAULT_CHANGE: DocChange = {
	path: "src/content/docs/cli/index.mdx",
	action: "update",
	content: "proposed page",
}

/** A synthesizer that proposes one fixed change, for runs that are not about synthesis. */
export function createFakeSynthesizer(
	changes: readonly DocChange[],
	calls: string[],
): ProposalSynthesizer {
	return {
		async synthesize(): Promise<readonly DocChange[]> {
			calls.push("proposal.synthesize")
			return changes
		},
	}
}

/** Docs Sync over in-memory adapters: no network, no filesystem, no clock. */
export function createFakeDeps(options: FakeDepsOptions = {}): FakeDepsRecord {
	const calls: string[] = []
	const upstreamReads: { readonly repository: string; readonly tag: string }[] = []
	const messages: string[] = []
	const errors: string[] = []
	const git = { calls, branches: [] as string[], commits: [], pullRequests: [] }
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
				return {
					...release,
					repository: input.repository,
					tag: input.tag,
					changelog: input.changelog,
				}
			},
		},
		docsContentStore: {
			async list(): Promise<readonly PortalFile[]> {
				calls.push("docs.list")
				return options.docs ?? []
			},
		},
		proposalSynthesizer:
			options.proposalSynthesizer ??
			createFakeSynthesizer(options.changes ?? [DEFAULT_CHANGE], calls),
		gitClient: createFakeGitClient(git),
		logger: createFakeLogger(messages, errors),
		now: (): string => options.nowIso ?? "2026-03-01T00:00:00.000Z",
	}
	return { deps, ...git, upstreamReads, messages, errors }
}
