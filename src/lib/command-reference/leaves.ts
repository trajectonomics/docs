import type { ContentFile } from "../content-pages"
import { flagProblems, problem } from "./flags"
import { commandReferencePages, documentedFlags, pageOf, pagePathFor } from "./pages"
import { pageSections } from "./sections"
import type { CommandReferenceProblem, ReleaseLeaf, ReleaseSnapshot } from "./types"

/** Every place one released leaf is missing from the pages, or its flags disagree with them. */
export function leafProblems(
	release: ReleaseSnapshot,
	files: readonly ContentFile[],
	leaf: ReleaseLeaf,
): readonly CommandReferenceProblem[] {
	const topLevel = leaf.name.split(" ")[0] ?? leaf.name
	const page = pageOf(files, topLevel)
	if (page === undefined) {
		return Object.freeze([
			problem(
				"leaf-page-missing",
				pagePathFor(topLevel),
				leaf.name,
				"",
				`traj ${release.version} has this leaf, but the page does not exist`,
			),
		])
	}
	const documented = documentedFlags(pageSections(page.content), leaf.name)
	if (documented === undefined) {
		return Object.freeze([
			problem(
				"leaf-page-missing",
				page.path,
				leaf.name,
				"",
				`traj ${release.version} has this leaf, but the page has no section for it`,
			),
		])
	}
	const allowed = new Set([...leaf.flags, ...release.globalFlags])
	const scope = { file: page.path, leaf: leaf.name, version: release.version }
	return flagProblems(scope, documented, leaf.flags, allowed)
}

/** Every leaf-claiming heading that names a command the release does not have. */
export function unknownLeaves(
	files: readonly ContentFile[],
	released: ReadonlySet<string>,
): readonly CommandReferenceProblem[] {
	return Object.freeze(
		commandReferencePages(files).flatMap((page) =>
			pageSections(page.content).flatMap((section) => {
				if (section.leaf === undefined || released.has(section.leaf)) return []
				return [
					problem(
						"leaf-unknown",
						page.path,
						section.leaf,
						"",
						"the page claims this leaf, but the release does not have it",
					),
				]
			}),
		),
	)
}
