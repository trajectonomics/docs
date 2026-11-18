import type { ContentFile } from "../content-pages"
import { flagProblems } from "./flags"
import { pageOf, pagePathFor } from "./pages"
import { GLOBAL_LEAF, GLOBAL_OPTIONS_HEADING, pageSections } from "./sections"
import type { CommandReferenceProblem, ReleaseSnapshot } from "./types"

/** The global flags, checked against the index page's `Global options` section. */
export function globalProblems(
	release: ReleaseSnapshot,
	files: readonly ContentFile[],
): readonly CommandReferenceProblem[] {
	const page = pageOf(files, "index")
	const documented =
		page === undefined
			? []
			: (pageSections(page.content).find((section) => section.heading === GLOBAL_OPTIONS_HEADING)
					?.flags ?? [])
	const scope = {
		file: page?.path ?? pagePathFor("index"),
		leaf: GLOBAL_LEAF,
		version: release.version,
	}
	const allowed = new Set(release.globalFlags)
	return flagProblems(scope, documented, release.globalFlags, allowed)
}
