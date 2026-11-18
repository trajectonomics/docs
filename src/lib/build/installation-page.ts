import type { BuiltFile } from "./built-files"
import { fileAt } from "./built-files"
import type { BuildFailure } from "./failures"
import { buildFailure } from "./failures"
import { visibleText } from "./html"

/** Assets-root path of the built Installation page. */
export const INSTALLATION_PAGE_FILE = "docs/cli/installation/index.html"

/** A `<pre>` block of a built page: the code a reader can copy out of it. */
const CODE_BLOCK = /<pre\b[^>]*>([\s\S]*?)<\/pre>/gi

/** A `PATH` assignment, which a line that adds the install directory has to carry. */
const PATH_ASSIGNMENT = "PATH="

/** The directory the Unix install script writes `traj` into, or the variable that overrides it. */
const INSTALL_DIRECTORY = /\.local\/bin|TRAJ_INSTALL_DIR/

/**
 * Whether one code block's visible text carries both the assignment and the directory. The
 * highlighter splits a line into tokens, so the check reads the code as one string with no
 * whitespace: rewording, quoting or reordering the tokens never hides the line from it.
 */
function putsDirectoryOnPath(block: string): boolean {
	const code = visibleText(block).replace(/\s+/g, "")
	return code.includes(PATH_ASSIGNMENT) && INSTALL_DIRECTORY.test(code)
}

/**
 * Failures for an Installation page that never shows the reader how to put the install directory on
 * `PATH`. The Unix install script does not edit the shell profile, so the page has to.
 */
export function checkInstallationPage(files: readonly BuiltFile[]): readonly BuildFailure[] {
	const page = fileAt(files, INSTALLATION_PAGE_FILE)
	if (page === undefined) return []
	const blocks = [...page.content.matchAll(CODE_BLOCK)]
	if (blocks.some((block) => putsDirectoryOnPath(block[1] ?? ""))) return []
	return [
		buildFailure(
			"INSTALLATION_PAGE_PATH_LINE_MISSING",
			page.path,
			"no code block puts the install directory on PATH",
		),
	]
}
