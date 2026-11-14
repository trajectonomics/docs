import { type SerializedPageTree, useFumadocsLoader } from "fumadocs-core/source/client"
import type { TOCItemType } from "fumadocs-core/toc"
import { DocsLayout } from "fumadocs-ui/layouts/notebook"
import { DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/notebook/page"
import type { LayoutTab } from "fumadocs-ui/layouts/shared"
import { baseOptions } from "../lib/layout.shared"
import { isTabPath, TABS, tabUrl } from "../lib/tabs"
import { Provider, type ProviderProps } from "./provider"
import { Wordmark } from "./wordmark"

export interface DocsProps extends ProviderProps {
	tree: SerializedPageTree
	title: string
	description?: string | undefined
	toc: TOCItemType[]
}

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
	const options = baseOptions("notebook", { navTitle: <Wordmark /> })

	return (
		<Provider {...props}>
			<DocsLayout
				{...options}
				nav={{ ...options.nav, mode: "top" }}
				tree={data.tree}
				tabMode="navbar"
				tabs={headerTabs(props.pathname)}
				sidebar={{ className: "border-e" }}
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
