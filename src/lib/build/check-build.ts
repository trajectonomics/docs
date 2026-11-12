import type { BuiltFile } from "./built-files"
import type { BuildFailure } from "./failures"
import { checkHeaderTabs } from "./header-tabs"
import { checkRedirects } from "./redirects"
import { checkRequiredPages } from "./required-pages"
import { checkSearchIndex } from "./search-index"
import { checkSearchIndexPages } from "./search-index-pages"
import { checkSidebarTitles } from "./sidebar-titles"
import { checkTocPlaceholder } from "./toc-placeholder"

/** Every rule the built Docs Portal fails, so one run names all of them instead of the first. */
export function checkBuild(files: readonly BuiltFile[]): readonly BuildFailure[] {
	return [
		...checkRequiredPages(files),
		...checkSearchIndex(files),
		...checkSearchIndexPages(files),
		...checkRedirects(files),
		...checkHeaderTabs(files),
		...checkSidebarTitles(files),
		...checkTocPlaceholder(files),
	]
}
