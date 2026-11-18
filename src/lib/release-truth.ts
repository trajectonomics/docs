import type { ContentFile } from "./content-pages"
import type { SyncManifest } from "./docs-sync/manifest"
import { manifestEntry } from "./docs-sync/manifest"
import { SUPPORTED_UPSTREAM_PACKAGES, UPSTREAM_OWNER } from "./docs-sync/package-map"
import type { UpstreamPackageName } from "./docs-sync/types"

/** One rule of the release truth check; one value per way a page can name the wrong release. */
export type ReleaseTruthRule = "upstream-link" | "cli-pin" | "operator-tab-version"

/** A page that names a release other than the one the sync manifest records for it. */
export interface ReleaseTruthProblem {
	readonly rule: ReleaseTruthRule
	readonly file: string
	readonly detail: string
}

/** The content folder of the Operator tab, whose pages document the `cli` release. */
export const OPERATOR_TAB_CONTENT = "cli"

/** One semantic version, with an optional prerelease suffix. */
const RELEASE = String.raw`\d+\.\d+\.\d+(?:-[0-9A-Za-z.]+)?`

/** `github.com/trajectonomics/<package>/blob/<tag>/`, capturing the package and the tag. */
const UPSTREAM_LINK = new RegExp(
	`github\\.com/${UPSTREAM_OWNER}/([a-z0-9-]+)/blob/([^/\\s)]+)/`,
	"g",
)

/** The ways a page pins the CLI release, each with the label a problem reports. */
const CLI_PINS: readonly { readonly pattern: RegExp; readonly label: string }[] = [
	{ pattern: new RegExp(`@trajectonomics/cli@(${RELEASE})`, "g"), label: "@trajectonomics/cli" },
	{ pattern: new RegExp(`TRAJ_VERSION=(${RELEASE})`, "g"), label: "TRAJ_VERSION" },
]

/** A bare release token in the Operator tab, outside a link, an npm spec or a pin. */
const BARE_RELEASE = new RegExp(`(?<![\\w.@/=-])v?(${RELEASE})(?![\\w.-])`, "g")

/** The release the manifest records for `name`, or `undefined` when it is not an Upstream Package. */
function expectedTag(manifest: SyncManifest, name: string): string | undefined {
	if (!SUPPORTED_UPSTREAM_PACKAGES.includes(name as UpstreamPackageName)) {
		return undefined
	}
	return manifestEntry(manifest, name as UpstreamPackageName)?.lastSyncedTag
}

/** The CLI release without its leading `v`, the form an npm or install-script pin uses. */
function cliVersion(manifest: SyncManifest): string | undefined {
	return manifestEntry(manifest, "cli")?.lastSyncedTag.replace(/^v/, "")
}

function linkProblems(file: ContentFile, manifest: SyncManifest): readonly ReleaseTruthProblem[] {
	return [...file.content.matchAll(UPSTREAM_LINK)].flatMap((match) => {
		const [, name, tag] = match
		const expected = name === undefined ? undefined : expectedTag(manifest, name)
		if (name === undefined || tag === undefined || expected === undefined || tag === expected) {
			return []
		}
		const detail = `links ${name} at ${tag}, but the manifest records ${expected}`
		return [{ rule: "upstream-link", file: file.path, detail }]
	})
}

function pinProblems(file: ContentFile, manifest: SyncManifest): readonly ReleaseTruthProblem[] {
	const version = cliVersion(manifest)
	if (version === undefined) return []
	return CLI_PINS.flatMap(({ pattern, label }) =>
		[...file.content.matchAll(pattern)].flatMap((match) => {
			const pinned = match[1]
			if (pinned === undefined || pinned === version) return []
			return [
				{
					rule: "cli-pin",
					file: file.path,
					detail: `pins ${label} at ${pinned}, but the manifest records cli ${version}`,
				},
			]
		}),
	)
}

function operatorTabProblems(
	file: ContentFile,
	manifest: SyncManifest,
): readonly ReleaseTruthProblem[] {
	if (!file.path.startsWith(`${OPERATOR_TAB_CONTENT}/`)) return []
	const tag = expectedTag(manifest, "cli")
	if (tag === undefined) return []
	return [...file.content.matchAll(BARE_RELEASE)].flatMap((match) => {
		const named = match[1]
		if (named === undefined || match[0] === tag) return []
		return [
			{
				rule: "operator-tab-version",
				file: file.path,
				detail: `names ${match[0]}, but the manifest records cli ${tag}`,
			},
		]
	})
}

/** Every place a page names a release the sync manifest disagrees with; empty when all agree. */
export function checkReleaseTruth(
	files: readonly ContentFile[],
	manifest: SyncManifest,
): readonly ReleaseTruthProblem[] {
	return files.flatMap((file) => [
		...linkProblems(file, manifest),
		...pinProblems(file, manifest),
		...operatorTabProblems(file, manifest),
	])
}
