import { useEffect, useState } from "react"
import { twinPath } from "../lib/agent/twin-path"
import {
	AGENT_LINE_LOAD,
	AGENT_LINE_PREFIX,
	AGENT_LINE_SEPARATOR,
	DOCS_INDEX_LINK_NAME,
	MARKDOWN_LINK_NAME,
} from "../lib/agent-line"
import { DOCS_INDEX_PATH } from "../lib/tabs"

/** One of the line's two links: the line is body text, so a link adds an underline and nothing else. */
const LINK_CLASS =
	"underline decoration-dotted underline-offset-4 transition-colors hover:text-fd-accent-foreground"

/**
 * The path the reader is on. The docs pages' line lives in a React island the Client Router keeps
 * mounted across navigations, so a pathname captured at first render would name the page the reader
 * arrived on; the router announces each navigation with `astro:page-load`, and the line follows it.
 */
function useCurrentPathname(initialPathname: string): string {
	const [pathname, setPathname] = useState(initialPathname)
	useEffect(() => {
		const follow = () => setPathname(window.location.pathname)
		follow()
		document.addEventListener("astro:page-load", follow)
		return () => document.removeEventListener("astro:page-load", follow)
	}, [])
	return pathname
}

/** The one muted line pointing a reader, and an Agent, at this page's Markdown twin and the Docs index. */
export function AgentLine({ pageUrl }: { readonly pageUrl: string }) {
	const twin = twinPath(useCurrentPathname(pageUrl))
	return (
		<p data-agent-line="" className="text-sm text-fd-muted-foreground">
			{AGENT_LINE_PREFIX}{" "}
			<a href={twin} {...AGENT_LINE_LOAD} className={LINK_CLASS}>
				{MARKDOWN_LINK_NAME}
			</a>{" "}
			{AGENT_LINE_SEPARATOR} the{" "}
			<a href={DOCS_INDEX_PATH} {...AGENT_LINE_LOAD} className={LINK_CLASS}>
				{DOCS_INDEX_LINK_NAME}
			</a>
		</p>
	)
}
