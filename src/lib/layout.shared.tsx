import type { BaseLayoutProps, LinkItemType } from "fumadocs-ui/layouts/shared"
import { HeaderMark } from "../components/header-mark"
import { SITE_HOME_LABEL, SITE_HOME_LOAD, SITE_HOME_PATH } from "./site-home"
import { DOCS_BASE_PATH } from "./tabs"

/** The Fumadocs layout the options serve: they nest a link item differently, so the link differs. */
export type PortalLayout = "notebook" | "home"

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

/**
 * Layout options shared by every Docs Portal page of `layout`. Every page carries the Portal's one
 * header mark, here and nowhere else, so a page cannot choose another (docs#75, ADR 0009). The docs
 * pages carry no header link items: the Site Home is the sidebar's button, and the Tabs are the
 * header's only other control (ADR 0009). No layout offers a theme switch, because the portal
 * renders one Theme for every reader.
 */
export function baseOptions(layout: PortalLayout): BaseLayoutProps {
	return {
		nav: { title: HeaderMark, url: `${DOCS_BASE_PATH}/` },
		links: layout === "home" ? [...homeSiteHomeLinks()] : [],
		// The Docs Portal exposes one Theme for now (docs#89), so no control offers the other
		// one. Light's return flips this option and deletes the provider's forced value.
		themeSwitch: { enabled: false },
	}
}
