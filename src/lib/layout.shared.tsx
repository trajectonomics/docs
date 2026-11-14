import type { BaseLayoutProps, LinkItemType } from "fumadocs-ui/layouts/shared"
import type { ReactNode } from "react"
import { DOCS_BASE_PATH } from "./tabs"

/** The Docs Portal's name, shown in the header and as the Landing Page heading. */
export const PORTAL_NAME = "Trajectonomics Docs"

/** The one sentence that says what the Docs Portal is for. */
export const PORTAL_PURPOSE =
	"Documentation for running the Trajectonomics CLI and building on its packages."

/** Visible text of the link to the Site Home. */
export const SITE_HOME_LABEL = "trajectonomics.com"

/**
 * URL path of the Site Home, the page at `/` that `trajectonomics/site` deploys. Relative, so
 * the href is right on the apex and on the staging `workers.dev` host (ADR 0006, ADR 0005).
 */
export const SITE_HOME_PATH = "/"

/** The Fumadocs layout the options serve: they nest a link item differently, so the link differs. */
export type PortalLayout = "notebook" | "home"

/**
 * The link a reader clicks to leave the Docs Portal. A child anchor, not a normal link item,
 * because only a custom child renders as given: a full document load (`data-astro-reload`), and
 * no prefetch, which would fetch `/` on hover (a page staging does not serve). The classes are
 * the header and sidebar link treatment.
 */
function siteHomeAnchor() {
	return (
		<a
			href={SITE_HOME_PATH}
			data-astro-reload
			data-astro-prefetch="false"
			className="inline-flex items-center rounded-lg p-2 text-sm text-fd-muted-foreground transition-colors hover:text-fd-accent-foreground"
		>
			{SITE_HOME_LABEL}
		</a>
	)
}

/** The Site Home link of the notebook layout, which nests a link item in a `<div>`. */
function notebookSiteHomeLink(): LinkItemType {
	return { type: "custom", children: siteHomeAnchor() }
}

/**
 * The Site Home links of the home layout: from the sm breakpoint up its header nests link items in
 * a `<ul>`, so that copy is a list item; below sm the header menu nests them in a `<div>`.
 */
function homeSiteHomeLinks(): readonly LinkItemType[] {
	return [
		{ type: "custom", on: "nav", children: <li>{siteHomeAnchor()}</li> },
		{ type: "custom", on: "menu", children: siteHomeAnchor() },
	]
}

export interface BaseOptions {
	/** The header title; the docs pages pass the design-system wordmark. */
	readonly navTitle?: ReactNode
}

/** Layout options shared by every Docs Portal page of `layout`. */
export function baseOptions(layout: PortalLayout, options?: BaseOptions): BaseLayoutProps {
	return {
		nav: { title: options?.navTitle ?? PORTAL_NAME, url: `${DOCS_BASE_PATH}/` },
		links: layout === "home" ? [...homeSiteHomeLinks()] : [notebookSiteHomeLink()],
	}
}
