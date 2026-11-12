import { TABS, type TabDefinition, tabUrl } from "../tabs"
import type { BuiltFile } from "./built-files"
import { fileAt } from "./built-files"
import type { BuildFailure } from "./failures"
import { buildFailure } from "./failures"
import type { HtmlAnchor } from "./html"
import { anchors, elementContent } from "./html"

/** Assets-root path of a Tab's built index page. */
function tabPageFile(tab: TabDefinition): string {
	return `docs/${tab.folder}/index.html`
}

function missingFailures(file: BuiltFile, links: readonly HtmlAnchor[]): readonly BuildFailure[] {
	return TABS.filter((tab) => !links.some((link) => link.href === tabUrl(tab))).map((tab) =>
		buildFailure("HEADER_TAB_LINK_MISSING", file.path, `#nd-subnav has no link to ${tabUrl(tab)}`),
	)
}

function currentFailures(
	file: BuiltFile,
	tab: TabDefinition,
	links: readonly HtmlAnchor[],
): readonly BuildFailure[] {
	return links.flatMap((link) => {
		const isCurrent = link.href === tabUrl(tab)
		const marked = link.ariaCurrent === "page"
		if (isCurrent && !marked) {
			return [
				buildFailure(
					"HEADER_TAB_NOT_CURRENT",
					file.path,
					`#nd-subnav gives ${link.href} no aria-current="page" on the ${tab.title} page`,
				),
			]
		}
		if (!isCurrent && marked) {
			return [
				buildFailure(
					"HEADER_TAB_OTHER_CURRENT",
					file.path,
					`#nd-subnav marks ${link.href} aria-current="page" on the ${tab.title} page`,
				),
			]
		}
		return []
	})
}

function headerFailures(file: BuiltFile, tab: TabDefinition): readonly BuildFailure[] {
	const links = anchors(elementContent(file.content, "nd-subnav") ?? "").filter((link) =>
		TABS.some((candidate) => tabUrl(candidate) === link.href),
	)
	return [...missingFailures(file, links), ...currentFailures(file, tab, links)]
}

/** Failures for Tab links a built Tab page's header lacks, or marks as current on the wrong page. */
export function checkHeaderTabs(files: readonly BuiltFile[]): readonly BuildFailure[] {
	return TABS.flatMap((tab) => {
		const file = fileAt(files, tabPageFile(tab))
		return file === undefined ? [] : headerFailures(file, tab)
	})
}
