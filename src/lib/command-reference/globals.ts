import type { ContentFile } from "../content-pages"
import { flagProblems } from "./flags"
import { PAGE_EXTENSIONS, pageOf } from "./pages"
import {
	COMMAND_REFERENCE_ROOT,
	GLOBAL_LEAF,
	GLOBAL_OPTIONS_HEADING,
	pageSections,
} from "./sections"
import type { CommandReferenceProblem, ReleaseSnapshot } from "./types"

/** The global flags, checked against the index page's `Global options` section. */
export function globalProblems(
	release: ReleaseSnapshot,
	files: readonly ContentFile[],
): readonly CommandReferenceProblem[] {
	const page = pageOf(files, "index")
	const path = page?.path ?? `${COMMAND_REFERENCE_ROOT}/index${PAGE_EXTENSIONS[0]}`
	const documented =
		page === undefined
			? []
			: (pageSections(page.content).find((section) => section.heading === GLOBAL_OPTIONS_HEADING)
					?.flags ?? [])
	const allowed = new Set(release.globalFlags)
	return flagProblems(path, GLOBAL_LEAF, documented, release.globalFlags, allowed, release.version)
}
