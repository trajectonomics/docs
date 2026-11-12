/** URL path the Docs Portal is served under. */
export const DOCS_BASE_PATH = "/docs"

/** A top-level Tab of the Docs Portal, addressed to exactly one audience. */
export interface TabDefinition {
	/** Folder under `src/content/docs/`, also the first URL segment of the Tab. */
	readonly folder: string
	readonly title: string
	readonly audience: "Operator" | "Builder"
	/** The Landing Page entry that sends this Tab's audience here. */
	readonly entry: string
}

/** The two Tabs of the Docs Portal, the Operator tab first. */
export const TABS: readonly [TabDefinition, TabDefinition] = [
	{
		folder: "cli",
		title: "CLI & Quickstart",
		audience: "Operator",
		entry: "For Operators: install and run the CLI",
	},
	{
		folder: "developers",
		title: "Build on Trajectonomics",
		audience: "Builder",
		entry: "For Builders: build on Trajectonomics packages",
	},
]

/** Absolute URL path of a Tab's index page, with a trailing slash. */
export function tabUrl(tab: TabDefinition): string {
	return `${DOCS_BASE_PATH}/${tab.folder}/`
}

/** Whether `pathname` is a page of the Tab `tab`, its index page included. */
export function isTabPath(tab: TabDefinition, pathname: string): boolean {
	return pathname.startsWith(tabUrl(tab))
}

/** URL path of the static search index, exported at build time (see `pages/api/search.json.ts`). */
export const SEARCH_INDEX_PATH = `${DOCS_BASE_PATH}/api/search.json`
