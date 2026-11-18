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
 * Attributes of the Site Home link that make it a full document load: `/` is not a page the Docs
 * Portal serves, so it must not be prefetched by the Client Router on hover (ADR 0006).
 */
export const SITE_HOME_LOAD = {
	"data-astro-reload": true,
	"data-astro-prefetch": "false",
} as const

/**
 * The link a reader clicks to leave the Docs Portal, as the home layout's header renders it: a
 * link item, because only a custom child renders as given (`SITE_HOME_LOAD`). The classes are the
 * control corner and the header link treatment.
 */
function siteHomeAnchor() {
	return (
		<a
			href={SITE_HOME_PATH}
			{...SITE_HOME_LOAD}
			className="inline-flex items-center rounded-sm p-2 text-sm text-fd-muted-foreground transition-colors hover:text-fd-accent-foreground"
		>
			{SITE_HOME_LABEL}
		</a>
	)
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

/**
 * The way back to the Site Home on the docs pages: the bordered button at the top of the sidebar
 * (ADR 0009). It takes the shell's control surface — the border, secondary ground and radius roles,
 * muted until the reader points at it — and it always loads the Site Home as a full document.
 */
export function siteHomeButton() {
	return (
		<a
			href={SITE_HOME_PATH}
			{...SITE_HOME_LOAD}
			data-site-home=""
			className="flex w-full items-center justify-between gap-2 rounded-lg border p-2 text-sm transition-colors"
		>
			{SITE_HOME_LABEL}
			<span aria-hidden="true">↗</span>
		</a>
	)
}

export interface BaseOptions {
	/** The header title; the docs pages pass the design-system wordmark. */
	readonly navTitle?: ReactNode
}

/**
 * Layout options shared by every Docs Portal page of `layout`. The docs pages carry no header link
 * items: the Site Home is the sidebar's button, and the Tabs are the header's only other control
 * (ADR 0009). No layout offers a theme switch, because the portal renders one Theme for every
 * reader.
 */
export function baseOptions(layout: PortalLayout, options?: BaseOptions): BaseLayoutProps {
	return {
		nav: { title: options?.navTitle ?? PORTAL_NAME, url: `${DOCS_BASE_PATH}/` },
		links: layout === "home" ? [...homeSiteHomeLinks()] : [],
		// The Docs Portal exposes one Theme for now (docs#89), so no control offers the other
		// one. Light's return flips this option and deletes the provider's forced value.
		themeSwitch: { enabled: false },
	}
}
