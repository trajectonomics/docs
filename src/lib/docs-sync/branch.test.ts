import { describe, expect, test } from "bun:test"
import { assertSyncBranch, MAIN_BRANCH, syncBranchName } from "./branch"
import { DocsSyncError } from "./errors"

function refusalOf(run: () => void): DocsSyncError {
	try {
		run()
	} catch (error) {
		if (error instanceof DocsSyncError) {
			return error
		}
		throw error
	}
	throw new Error("expected the branch to be refused")
}

describe("Docs Sync branch names", () => {
	test("a release gets an isolated branch named after its package and tag", () => {
		expect(syncBranchName("cli", "v0.1.0")).toBe("docs-sync/cli/v0.1.0")
		expect(syncBranchName("design-system", "v2.0.0-rc.1")).toBe(
			"docs-sync/design-system/v2.0.0-rc.1",
		)
	})

	test("two packages releasing the same tag never collide on one branch", () => {
		expect(syncBranchName("cli", "v1.0.0")).not.toBe(syncBranchName("sim-core", "v1.0.0"))
	})

	test("a tag that cannot sit inside a branch name is refused", () => {
		expect(refusalOf(() => syncBranchName("cli", "../../main"))).toMatchObject({
			code: "BRANCH_NAME_INVALID",
			field: "tag",
		})
		expect(refusalOf(() => syncBranchName("cli", "v0..1"))).toMatchObject({
			code: "BRANCH_NAME_INVALID",
		})
		expect(refusalOf(() => syncBranchName("cli", "v0 1"))).toMatchObject({
			code: "BRANCH_NAME_INVALID",
		})
	})

	test("Docs Sync only writes docs-sync branches and never the default branch", () => {
		expect(() => assertSyncBranch("docs-sync/cli/v0.1.0")).not.toThrow()
		expect(refusalOf(() => assertSyncBranch(MAIN_BRANCH))).toMatchObject({
			code: "PROTECTED_BRANCH",
		})
		expect(refusalOf(() => assertSyncBranch("refs/heads/main"))).toMatchObject({
			code: "PROTECTED_BRANCH",
		})
		expect(refusalOf(() => assertSyncBranch("factory/12-docs-sync"))).toMatchObject({
			code: "BRANCH_NAME_INVALID",
		})
	})
})
