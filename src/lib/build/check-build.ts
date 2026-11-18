import type { BuiltFile } from "./built-files"
import type { BuildFailure } from "./failures"
import { checkHeaderMark } from "./header-mark"
import { checkHeaderTabs } from "./header-tabs"
import { checkImportTemplate } from "./import-template"
import { checkInstallationPage } from "./installation-page"
import { checkLandingPage } from "./landing-page"
import { checkNotFoundPage } from "./not-found"
import { checkPlaceholderCopy } from "./placeholder-copy"
import { checkRedirects } from "./redirects"
import { checkRequiredPages } from "./required-pages"
import { checkSearchIndex } from "./search-index"
import { checkSearchIndexPages } from "./search-index-pages"
import { checkSidebarTitles } from "./sidebar-titles"
import { checkSitemapPages } from "./sitemap-pages"
import { checkTabAliases } from "./tab-aliases"
import { checkTheme } from "./theme"
import { checkTocPlaceholder } from "./toc-placeholder"

/** Every rule the built Docs Portal fails, so one run names all of them instead of the first. */
export function checkBuild(
	files: readonly BuiltFile[],
	releaseLine: string,
): readonly BuildFailure[] {
	return [
		...checkRequiredPages(files),
		...checkNotFoundPage(files),
		...checkSearchIndex(files),
		...checkSearchIndexPages(files),
		...checkSitemapPages(files),
		...checkLandingPage(files, releaseLine),
		...checkRedirects(files),
		...checkTabAliases(files),
		...checkHeaderTabs(files),
		...checkHeaderMark(files),
		...checkSidebarTitles(files),
		...checkTocPlaceholder(files),
		...checkInstallationPage(files),
		...checkPlaceholderCopy(files),
		...checkImportTemplate(files),
		...checkTheme(files),
	]
}
