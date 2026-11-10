import { DocsSyncError } from "./errors"
import type { PackageTarget, UpstreamPackageName } from "./types"

/** The only GitHub organization an Upstream Package may come from. */
export const UPSTREAM_OWNER = "trajectonomics"

/** Every Upstream Package, in the order the sync manifest lists them. */
export const SUPPORTED_UPSTREAM_PACKAGES: readonly UpstreamPackageName[] = [
	"cli",
	"sim-core",
	"ledger-core",
	"tax-core",
	"design-system",
]

function target(
	upstreamPackage: UpstreamPackageName,
	contentDir: string,
	audience: PackageTarget["audience"],
): PackageTarget {
	return Object.freeze({ upstreamPackage, contentDir, audience })
}

/** Every Upstream Package, mapped to the Tab and folder its proposals land in. */
const PACKAGE_TARGETS: Readonly<Record<UpstreamPackageName, PackageTarget>> = Object.freeze({
	cli: target("cli", "src/content/docs/cli", "Operator"),
	"sim-core": target("sim-core", "src/content/docs/developers/sim-core", "Builder"),
	"ledger-core": target("ledger-core", "src/content/docs/developers/ledger-core", "Builder"),
	"tax-core": target("tax-core", "src/content/docs/developers/tax-core", "Builder"),
	"design-system": target("design-system", "src/content/docs/developers/design-system", "Builder"),
})

/**
 * The Tab and folder a release of `repo` proposes edits in. `repo` is the dispatch value,
 * `owner/name` or a bare package name; any other owner is refused, because only this
 * organization's repositories are Upstream Packages. `field` is `repo`, the payload key.
 */
export function resolvePackageTarget(repo: string): PackageTarget {
	const segments = repo.trim().split("/")
	const name = segments[segments.length - 1]
	const owner = segments.length === 1 ? UPSTREAM_OWNER : segments[0]
	const known =
		segments.length <= 2 &&
		owner === UPSTREAM_OWNER &&
		name !== undefined &&
		Object.hasOwn(PACKAGE_TARGETS, name)
	if (!known) {
		throw new DocsSyncError(
			"PACKAGE_UNSUPPORTED",
			`${repo} is not an Upstream Package, so Docs Sync has no Tab to propose into`,
			"repo",
		)
	}
	return PACKAGE_TARGETS[name as UpstreamPackageName]
}
