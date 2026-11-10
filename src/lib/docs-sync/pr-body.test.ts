import { describe, expect, test } from "bun:test"
import { resolvePackageTarget } from "./package-map"
import { renderDraftPullRequestBody } from "./pr-body"
import type { DocChange, UpstreamRelease } from "./types"

const CLI = resolvePackageTarget("trajectonomics/cli")
const RELEASE: UpstreamRelease = {
	repository: "trajectonomics/cli",
	tag: "v0.2.0",
	commitSha: "a1b2c3d4",
	documentationPaths: [],
	changelog: "### Added\n\n- `ledger accounts` lists accounts\n",
}
const CHANGES: readonly DocChange[] = [
	{ path: "src/content/docs/cli/index.mdx", action: "update", content: "page" },
	{ path: "docs-sync-manifest.json", action: "update", content: "{}" },
]

const BODY = renderDraftPullRequestBody({
	target: CLI,
	release: RELEASE,
	changes: CHANGES,
	previousTag: "v0.1.0",
})

describe("draft pull request body", () => {
	test("it links the upstream release, its commit and the comparison", () => {
		expect(BODY).toContain("https://github.com/trajectonomics/cli/releases/tag/v0.2.0")
		expect(BODY).toContain("`a1b2c3d4`")
		expect(BODY).toContain("https://github.com/trajectonomics/cli/compare/v0.1.0...v0.2.0")
	})

	test("it says the pull request is a draft a human must review", () => {
		expect(BODY).toContain("draft")
		expect(BODY).toMatch(/never commits to `main`/)
	})

	test("it lists every file it proposes, with what happens to it", () => {
		expect(BODY).toContain("- `src/content/docs/cli/index.mdx` (update)")
		expect(BODY).toContain("- `docs-sync-manifest.json` (update)")
	})

	test("its checklist asks for the review the maintainer has to do", () => {
		expect(BODY).toContain("- [ ]")
		expect(BODY).toMatch(/written for Operators/)
		expect(BODY).toMatch(/Only the latest release/)
		expect(BODY).toMatch(/linked to GitHub, never copied/)
	})

	test("the upstream documentation that exists at the tag is linked, never copied", () => {
		const body = renderDraftPullRequestBody({
			target: CLI,
			release: { ...RELEASE, documentationPaths: ["README.md", "docs/quickstart.md"] },
			changes: CHANGES,
			previousTag: "v0.1.0",
		})

		expect(body).toContain("## Upstream documentation at this tag")
		expect(body).toContain(
			"- [`docs/quickstart.md`](https://github.com/trajectonomics/cli/blob/v0.2.0/docs/quickstart.md)",
		)
		expect(body).toContain("Linked, never copied")
	})

	test("a release with no upstream documentation says nothing about it", () => {
		expect(BODY).not.toContain("Upstream documentation")
	})

	test("with no earlier tag there is nothing to compare, so no comparison link", () => {
		const body = renderDraftPullRequestBody({
			target: CLI,
			release: RELEASE,
			changes: CHANGES,
			previousTag: undefined,
		})
		expect(body).not.toContain("/compare/")
		expect(body).toContain("no earlier tag")
	})

	test("an oversized changelog is cut short and says where the rest is", () => {
		const body = renderDraftPullRequestBody({
			target: CLI,
			release: { ...RELEASE, changelog: `- ${"x".repeat(4000)}` },
			changes: CHANGES,
			previousTag: "v0.1.0",
		})
		expect(body.length).toBeLessThan(4000)
		expect(body).toContain("release page")
	})
})
