import type { ContentFile } from "../content-pages"
import { COMMAND_REFERENCE_ROOT } from "./sections"
import type { ReleaseLeaf, ReleaseSnapshot } from "./types"

/** The global flags every fixture release accepts. */
export const GLOBALS = ["--json", "-h", "--help", "-v", "--version"] as const

/** A release of the shape the runner builds, carrying the fixture global flags. */
export function release(leaves: readonly ReleaseLeaf[]): ReleaseSnapshot {
	return Object.freeze({
		version: "0.2.0",
		leaves: Object.freeze([...leaves]),
		globalFlags: GLOBALS,
	})
}

/** A command-reference page at its path in the content tree. */
export function page(name: string, content: string): ContentFile {
	return Object.freeze({ path: `${COMMAND_REFERENCE_ROOT}/${name}`, content })
}

/** The index page, whose `Global options` section documents every fixture global flag. */
export const INDEX = page(
	"index.mdx",
	[
		"## The command tree",
		"",
		"| Command | What it does |",
		"| --- | --- |",
		"",
		"## Global options",
		"",
		...GLOBALS.map((flag) => `- \`${flag}\` — accepted by every command.`),
	].join("\n"),
)

/** A page for `traj tx add`, a leaf the release in most tests has. */
export const TX_ADD = page(
	"tx.mdx",
	[
		"`traj tx` manages transactions.",
		"",
		"## `traj tx add`",
		"",
		"- `--from <string>` — the source account.",
		"- `--to <string>` — the destination account.",
	].join("\n"),
)

/** A page for `traj tx void`, which the release in most tests does not have. */
export const TX_VOID = page(
	"tx.mdx",
	"## `traj tx void <id>`\n\n- `--date <string>` — the reversal's date.\n",
)
