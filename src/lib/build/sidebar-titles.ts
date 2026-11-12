import { TABS } from "../tabs"
import type { BuiltFile } from "./built-files"
import type { BuildFailure } from "./failures"
import { buildFailure } from "./failures"
import { anchors, elementContent } from "./html"

const TAB_TITLES = new Set(TABS.map((tab) => tab.title))

/** Failures for built pages whose sidebar links a Tab title as if it were a page title. */
export function checkSidebarTitles(files: readonly BuiltFile[]): readonly BuildFailure[] {
	return files.flatMap((file) => {
		const sidebar = file.path.endsWith(".html")
			? elementContent(file.content, "nd-sidebar")
			: undefined
		if (sidebar === undefined) return []
		return anchors(sidebar)
			.filter((link) => TAB_TITLES.has(link.text))
			.map((link) =>
				buildFailure(
					"SIDEBAR_TAB_TITLE_LINK",
					file.path,
					`#nd-sidebar links to ${link.href} titled with the Tab name "${link.text}"`,
				),
			)
	})
}
