import type { LayoutTab } from "fumadocs-ui/layouts/shared"
import {
	FullSearchTrigger,
	type FullSearchTriggerProps,
	type SearchTriggerProps,
} from "fumadocs-ui/layouts/shared/slots/search-trigger"
import type { FC, ReactNode } from "react"
import { siteHomeButton } from "../lib/layout.shared"

/** The header's Tab treatment: Fumadocs' own, carried over from the row this change removes. */
const TAB_CLASS =
	"inline-flex items-center gap-2 border-b-2 border-transparent pb-1.5 text-sm font-medium text-fd-muted-foreground text-nowrap transition-colors hover:text-fd-accent-foreground"

const CURRENT_TAB_CLASS = "border-fd-primary text-fd-primary"

/**
 * The Tabs as the one header row's links, built from the same Tab definitions the sidebar's
 * dropdown offers. The current Tab keeps `aria-current="page"` for assistive technology and the
 * built-page check (ADR 0009). Below `lg` the sidebar's dropdown carries them instead, so the row
 * hides them.
 */
export function HeaderTabs({ tabs }: { readonly tabs: readonly LayoutTab[] }) {
	return (
		<div data-shell-tabs="" className="hidden items-center gap-6 lg:flex">
			{tabs.map((tab) => {
				const current = tab.props?.["aria-current"] === "page"
				return (
					<a
						key={tab.url}
						href={tab.url}
						data-shell-tab=""
						aria-current={current ? "page" : undefined}
						className={current ? `${TAB_CLASS} ${CURRENT_TAB_CLASS}` : TAB_CLASS}
					>
						{tab.title}
					</a>
				)
			})}
		</div>
	)
}

/**
 * The search leaves the header for the sidebar (ADR 0009), so both of the header's slots render
 * nothing. They stay assigned rather than disabled, because disabling search would remove the
 * sidebar's trigger with it.
 */
export const noHeaderSearchTrigger: {
	readonly sm: FC<SearchTriggerProps>
	readonly full: FC<FullSearchTriggerProps>
} = {
	sm: () => null,
	full: () => null,
}

export interface DocsSidebarBannerProps {
	/**
	 * What Fumadocs draws in a sidebar header: the Tab dropdown at every width, and in the drawer the
	 * close button beside it. The block places them below its hairline rather than re-creating them.
	 */
	readonly children?: ReactNode
}

/**
 * The sidebar's top block: the way back to the Site Home above the search trigger, a hairline under
 * them, then the header children Fumadocs passes a banner — its Tab dropdown, and in the drawer its
 * close button, drawn by the library rather than by this block. The tree follows the block; from
 * `lg` up it follows the hairline, because the dropdown is hidden there (ADR 0009).
 */
export function DocsSidebarBanner({ children }: DocsSidebarBannerProps) {
	return (
		<div data-sidebar-top-block="" className="flex flex-col">
			<div className="flex flex-col gap-2 border-b p-3">
				{siteHomeButton()}
				<FullSearchTrigger hideIfDisabled />
			</div>
			<div data-sidebar-tabs="" className="flex items-center gap-2 p-3 empty:hidden">
				{children}
			</div>
		</div>
	)
}
