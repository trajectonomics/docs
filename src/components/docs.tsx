import { type SerializedPageTree, useFumadocsLoader } from "fumadocs-core/source/client"
import type { TOCItemType } from "fumadocs-core/toc"
import { DocsLayout } from "fumadocs-ui/layouts/notebook"
import { DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/notebook/page"
import type { LayoutTab } from "fumadocs-ui/layouts/shared"
import { baseOptions } from "../lib/layout.shared"
import { isTabPath, TABS, tabUrl } from "../lib/tabs"
import { DocsSidebarBanner, HeaderTabs, noHeaderSearchTrigger } from "./docs-shell"
import { Provider, type ProviderProps } from "./provider"

export interface DocsProps extends ProviderProps {
	tree: SerializedPageTree
	title: string
	description?: string | undefined
	toc: TOCItemType[]
}

/**
 * The notebook grid the shell spans the page with: the two side gutters are zero, so the sidebar
 * sits at the left page edge and the table of contents at the right, the page track takes what is
 * left, and the header covers every column (ADR 0009). Fumadocs applies `containerProps.style`
 * after its own, so this replaces its template and nothing else; the tracks still come from the
 * library's column variables.
 */
const SHELL_GRID = [
	'"header header header header header"',
	'"sidebar sidebar toc-popover toc-popover ."',
	'"sidebar sidebar main toc ." 1fr',
	"/ 0 var(--fd-sidebar-col) minmax(0, 1fr) var(--fd-toc-col) 0",
].join("\n")

/** The header Tabs of one page, marking the current Tab for assistive technology. */
function headerTabs(pathname: string): LayoutTab[] {
	return TABS.map((tab) => ({
		title: tab.title,
		url: tabUrl(tab),
		...(isTabPath(tab, pathname) ? { props: { "aria-current": "page" } } : {}),
	}))
}

/** React island for a Docs Portal page; the page content is passed as children. */
export function Docs({ tree, title, description, toc, children, ...props }: DocsProps) {
	const data = useFumadocsLoader({ tree })
	const options = baseOptions("notebook")
	const tabs = headerTabs(props.pathname)

	return (
		<Provider {...props}>
			<DocsLayout
				{...options}
				nav={{ ...options.nav, mode: "top", children: <HeaderTabs tabs={tabs} /> }}
				tree={data.tree}
				tabMode="sidebar"
				tabs={tabs}
				sidebar={{
					className: "border-e",
					collapsible: false,
					banner: (bannerProps) => <DocsSidebarBanner {...bannerProps} pageUrl={props.pathname} />,
				}}
				slots={{ searchTrigger: noHeaderSearchTrigger }}
				containerProps={{ style: { gridTemplate: SHELL_GRID } }}
			>
				<DocsPage toc={toc} tableOfContent={{ enabled: toc.length > 0 }}>
					<DocsTitle className="text-4xl font-semibold tracking-tight md:text-5xl">
						{title}
					</DocsTitle>
					<DocsDescription className="text-lg">{description}</DocsDescription>
					{children}
				</DocsPage>
			</DocsLayout>
		</Provider>
	)
}
