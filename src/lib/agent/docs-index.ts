import { PORTAL_NAME, PORTAL_PURPOSE } from "../portal"
import { DOCS_BASE_PATH, type TabDefinition } from "../tabs"
import { shownDescription } from "./description"
import { twinUrl } from "./twin-url"

/** One page the Docs index lists: the words its bullet shows and the page URL its twin follows. */
export interface DocsIndexPage {
	readonly title: string
	readonly description?: string | undefined
	readonly url: string
}

/** One Tab's section of the Docs index: its pages in the order the Tab presents them. */
export interface DocsIndexTab {
	readonly tab: TabDefinition
	readonly pages: readonly DocsIndexPage[]
}

/** The heading of the section naming the Landing Page, which belongs to no Tab. */
const START_HERE = "Start here"

/** How an Agent fetches Markdown, in the index's own words. */
const FETCH_SENTENCE =
	"To fetch a page as Markdown, take its twin URL: the page's path with `.md` in place of the trailing slash, and `/docs/index.md` for the Landing Page. The links below are absolute, so this index works wherever it is read."

/** One bullet of the index: a page's title, its absolute twin URL and its description. */
function bullet(page: DocsIndexPage, origin: string): string {
	const description = shownDescription(page.description)
	const described = description === undefined ? "" : `: ${description}`
	return `- [${page.title}](${twinUrl(origin, page.url)})${described}`
}

/** The Docs index at `/docs/llms.txt`: every page once, in the order the Tabs present them. */
export function buildDocsIndex(tabs: readonly DocsIndexTab[], origin: string): string {
	const landingPage: DocsIndexPage = {
		title: PORTAL_NAME,
		description: PORTAL_PURPOSE,
		url: DOCS_BASE_PATH,
	}
	const lines = [
		`# ${PORTAL_NAME}`,
		"",
		`> ${PORTAL_PURPOSE}`,
		"> Every page is listed here with its description and the absolute URL of its Markdown twin.",
		"",
		FETCH_SENTENCE,
		"",
		`## ${START_HERE}`,
		"",
		bullet(landingPage, origin),
		"",
	]
	for (const { tab, pages } of tabs) {
		lines.push(`## ${tab.audience}`, "", ...pages.map((page) => bullet(page, origin)), "")
	}
	return lines.join("\n")
}
