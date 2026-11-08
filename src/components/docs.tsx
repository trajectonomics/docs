import { type SerializedPageTree, useFumadocsLoader } from "fumadocs-core/source/client"
import type { TOCItemType } from "fumadocs-core/toc"
import { DocsLayout } from "fumadocs-ui/layouts/docs"
import { DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/layouts/docs/page"
import { baseOptions } from "../lib/layout.shared"
import { Provider, type ProviderProps } from "./provider"

export interface DocsProps extends ProviderProps {
	tree: SerializedPageTree
	title: string
	description?: string | undefined
	toc: TOCItemType[]
}

/** React island for a Docs Portal page; the page content is passed as children. */
export function Docs({ tree, title, description, toc, children, ...props }: DocsProps) {
	const data = useFumadocsLoader({ tree })

	return (
		<Provider {...props}>
			<DocsLayout {...baseOptions()} tree={data.tree}>
				<DocsPage toc={toc}>
					<DocsTitle>{title}</DocsTitle>
					<DocsDescription>{description}</DocsDescription>
					{children}
				</DocsPage>
			</DocsLayout>
		</Provider>
	)
}
