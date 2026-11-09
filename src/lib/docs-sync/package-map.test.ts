import { describe, expect, test } from "bun:test"
import { DocsSyncError } from "./errors"
import { resolvePackageTarget } from "./package-map"

describe("Upstream Package mapping", () => {
	test("a cli release proposes changes in the Operator tab", () => {
		expect(resolvePackageTarget("trajectonomics/cli")).toEqual({
			upstreamPackage: "cli",
			contentDir: "src/content/docs/cli",
			audience: "Operator",
		})
	})

	test("each core engine proposes changes in its own folder of the Builder tab", () => {
		expect(
			["sim-core", "ledger-core", "tax-core", "design-system"].map(
				(upstreamPackage) => resolvePackageTarget(`trajectonomics/${upstreamPackage}`).contentDir,
			),
		).toEqual([
			"src/content/docs/developers/sim-core",
			"src/content/docs/developers/ledger-core",
			"src/content/docs/developers/tax-core",
			"src/content/docs/developers/design-system",
		])
	})

	test("every supported Upstream Package is in the Builder tab except cli", () => {
		expect(resolvePackageTarget("design-system").audience).toBe("Builder")
		expect(resolvePackageTarget("cli").audience).toBe("Operator")
	})

	test("a repository that is not an Upstream Package is refused", () => {
		let refusal: unknown
		try {
			resolvePackageTarget("trajectonomics/infra")
		} catch (error) {
			refusal = error
		}
		if (!(refusal instanceof DocsSyncError)) {
			throw new Error(`expected a DocsSyncError, got ${String(refusal)}`)
		}
		expect(refusal.code).toBe("PACKAGE_UNSUPPORTED")
		expect(refusal.field).toBe("repo")
	})
})
