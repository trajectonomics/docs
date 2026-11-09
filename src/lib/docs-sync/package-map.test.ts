import { describe, expect, test } from "bun:test"
import { DocsSyncError } from "./errors"
import { resolvePackageTarget } from "./package-map"

function refusalOf(repo: string): DocsSyncError {
	try {
		resolvePackageTarget(repo)
	} catch (error) {
		if (error instanceof DocsSyncError) {
			return error
		}
		throw error
	}
	throw new Error("expected the repository to be refused")
}

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
		expect(refusalOf("trajectonomics/infra")).toMatchObject({
			code: "PACKAGE_UNSUPPORTED",
			field: "repo",
		})
	})

	test("a package name from another owner is refused", () => {
		expect(refusalOf("evil-org/cli")).toMatchObject({ code: "PACKAGE_UNSUPPORTED" })
	})

	test("a path deeper than owner/name is refused", () => {
		expect(refusalOf("trajectonomics/cli/extra")).toMatchObject({ code: "PACKAGE_UNSUPPORTED" })
	})
})
