import { describe, expect, test } from "bun:test"
import {
	type ContentFile,
	type ContentStructureRule,
	checkContentStructure,
} from "./content-structure"

const CONTENT_ROOT = "src/content/docs"

async function readContentTree(): Promise<ContentFile[]> {
	const files: ContentFile[] = []
	const glob = new Bun.Glob("**/*.{md,mdx,json}")
	for await (const path of glob.scan({ cwd: CONTENT_ROOT })) {
		files.push({ path, content: await Bun.file(`${CONTENT_ROOT}/${path}`).text() })
	}
	return files.sort((left, right) => left.path.localeCompare(right.path))
}

const tree = await readContentTree()

function without(path: string): ContentFile[] {
	return tree.filter((file) => file.path !== path)
}

function withMeta(path: string, pages: readonly string[]): ContentFile[] {
	return tree.map((file) => {
		if (file.path !== path) {
			return file
		}
		const meta = JSON.parse(file.content) as Record<string, unknown>
		return { ...file, content: JSON.stringify({ ...meta, pages }) }
	})
}

function withPageLink(path: string, link: string): ContentFile[] {
	return tree.map((file) =>
		file.path === path ? { ...file, content: `${file.content}\n\n[Broken](${link})\n` } : file,
	)
}

function rulesOf(files: readonly ContentFile[]): readonly ContentStructureRule[] {
	return checkContentStructure(files).map((problem) => problem.rule)
}

describe("Docs Portal content structure", () => {
	test("the authored content tree satisfies every structural rule", () => {
		expect(checkContentStructure(tree)).toEqual([])
	})

	test("a Tab without a landing page is reported", () => {
		expect(rulesOf(without("cli/index.mdx"))).toContain("tab-landing-page")
	})

	test("a Tab without a navigation file is reported", () => {
		expect(rulesOf(without("developers/meta.json"))).toContain("tab-navigation")
	})

	test("a Tab missing from the content root navigation is reported", () => {
		expect(rulesOf(withMeta("meta.json", ["developers"]))).toContain("tab-listed")
	})

	test("an Upstream Package without a landing page is reported", () => {
		expect(rulesOf(without("developers/sim-core/index.mdx"))).toContain("package-landing-page")
	})

	test("an Upstream Package without a navigation file is reported", () => {
		expect(rulesOf(without("developers/tax-core/meta.json"))).toContain("package-navigation")
	})

	test("an Upstream Package missing from its Tab navigation is reported", () => {
		const pages = ["index", "sim-core", "tax-core", "design-system"]
		expect(rulesOf(withMeta("developers/meta.json", pages))).toContain("package-listed")
	})

	test("a navigation entry with no page behind it is reported", () => {
		const pages = ["index", "installation", "configuration", "commands", "missing"]
		expect(rulesOf(withMeta("cli/meta.json", pages))).toContain("navigation-entry")
	})

	test("an internal link with no page behind it is reported", () => {
		expect(rulesOf(withPageLink("developers/index.mdx", "/docs/developers/missing/"))).toContain(
			"internal-link",
		)
	})
})
