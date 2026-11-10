import {
	CONTENT_ROOT,
	type ContentFile,
	navigationEntries,
	resolvesNavigationEntry,
} from "./content-pages"
import type { ContentStructureProblem, ContentStructureRule } from "./content-structure"
import { resolvePackageTarget, SUPPORTED_UPSTREAM_PACKAGES } from "./docs-sync/package-map"
import { lastSegmentOf, parentOf } from "./docs-sync/portal-files"
import { TABS } from "./tabs"

/** The problems a required file is absent, or none. */
function missing(
	files: readonly ContentFile[],
	path: string,
	rule: ContentStructureRule,
): readonly ContentStructureProblem[] {
	return files.some((file) => file.path === path) ? [] : [{ rule, detail: `${path} is missing` }]
}

/** The problems `entry` is absent from a folder's navigation, or none. */
function unlisted(
	files: readonly ContentFile[],
	folder: string,
	entry: string,
	rule: "tab-listed" | "package-listed",
): readonly ContentStructureProblem[] {
	if (navigationEntries(files, folder).includes(entry)) {
		return []
	}
	const owner = folder === "" ? "the content root" : folder
	return [{ rule, detail: `${owner}/meta.json does not list ${entry}` }]
}

function tabProblems(files: readonly ContentFile[]): readonly ContentStructureProblem[] {
	return TABS.flatMap((tab) => [
		...missing(files, `${tab.folder}/index.mdx`, "tab-landing-page"),
		...missing(files, `${tab.folder}/meta.json`, "tab-navigation"),
		...unlisted(files, "", tab.folder, "tab-listed"),
	])
}

function packageProblems(files: readonly ContentFile[]): readonly ContentStructureProblem[] {
	const tabFolders = new Set(TABS.map((tab) => tab.folder))
	return SUPPORTED_UPSTREAM_PACKAGES.flatMap((name) => {
		const folder = resolvePackageTarget(name).contentDir.slice(CONTENT_ROOT.length + 1)
		if (tabFolders.has(folder)) {
			return []
		}
		return [
			...missing(files, `${folder}/index.mdx`, "package-landing-page"),
			...missing(files, `${folder}/meta.json`, "package-navigation"),
			...unlisted(files, parentOf(folder), lastSegmentOf(folder), "package-listed"),
		]
	})
}

function navigationProblems(files: readonly ContentFile[]): readonly ContentStructureProblem[] {
	return files
		.filter((file) => file.path.endsWith("meta.json"))
		.flatMap((file) => {
			const folder = parentOf(file.path)
			return navigationEntries(files, folder)
				.filter((entry) => !resolvesNavigationEntry(files, folder, entry))
				.map((entry) => ({
					rule: "navigation-entry" as const,
					detail: `${file.path} lists ${entry}, which has no page`,
				}))
		})
}

/** Every navigation rule the content tree breaks: Tabs, Upstream Packages and page entries. */
export function navigationStructureProblems(
	files: readonly ContentFile[],
): readonly ContentStructureProblem[] {
	return [...tabProblems(files), ...packageProblems(files), ...navigationProblems(files)]
}
