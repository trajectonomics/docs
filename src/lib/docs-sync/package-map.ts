import { DocsSyncError } from "./errors"
import type { PackageTarget, UpstreamPackageName } from "./types"

/** Every Upstream Package, in the order the sync manifest lists them. */
export const SUPPORTED_UPSTREAM_PACKAGES: readonly UpstreamPackageName[] = [
	"cli",
	"sim-core",
	"ledger-core",
	"tax-core",
	"design-system",
]

/** Every Upstream Package, mapped to the Tab and folder its proposals land in. */
const PACKAGE_TARGETS: Readonly<Record<UpstreamPackageName, PackageTarget>> = {
	cli: { upstreamPackage: "cli", contentDir: "src/content/docs/cli", audience: "Operator" },
	"sim-core": {
		upstreamPackage: "sim-core",
		contentDir: "src/content/docs/developers/sim-core",
		audience: "Builder",
	},
	"ledger-core": {
		upstreamPackage: "ledger-core",
		contentDir: "src/content/docs/developers/ledger-core",
		audience: "Builder",
	},
	"tax-core": {
		upstreamPackage: "tax-core",
		contentDir: "src/content/docs/developers/tax-core",
		audience: "Builder",
	},
	"design-system": {
		upstreamPackage: "design-system",
		contentDir: "src/content/docs/developers/design-system",
		audience: "Builder",
	},
}

/**
 * The Tab and folder a release of `repository` proposes edits in. `repository` is the dispatch
 * value, `owner/name` or a bare package name; only its last segment is matched.
 */
export function resolvePackageTarget(repository: string): PackageTarget {
	const name = repository.split("/").pop()
	if (name === undefined || !Object.hasOwn(PACKAGE_TARGETS, name)) {
		throw new DocsSyncError(
			"PACKAGE_UNSUPPORTED",
			`${repository} is not an Upstream Package, so Docs Sync has no Tab to propose into`,
			"repo",
		)
	}
	return PACKAGE_TARGETS[name as UpstreamPackageName]
}
