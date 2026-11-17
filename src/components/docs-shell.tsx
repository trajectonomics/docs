import {
	FullSearchTrigger,
	type FullSearchTriggerProps,
	type SearchTriggerProps,
} from "fumadocs-ui/layouts/shared/slots/search-trigger"
import type { FC } from "react"
import { siteHomeButton } from "../lib/layout.shared"
import { isTabPath, TABS, tabUrl } from "../lib/tabs"

/** The header's Tab treatment: Fumadocs' own, carried over with its two-row Tabs (ADR 0009). */
const TAB_CLASS =
	"inline-flex items-center gap-2 border-b-2 border-transparent pb-1.5 text-sm font-medium text-fd-muted-foreground text-nowrap transition-colors hover:text-fd-accent-foreground"

const CURRENT_TAB_CLASS = "border-fd-primary text-fd-primary"

/**
 * The two Tabs as the one header row's links. They are built from the same `TABS` helpers as the
 * sidebar's dropdown, and the current Tab is marked `aria-current="page"` for assistive technology
 * and the built-page check (ADR 0009). Below `lg` the sidebar's dropdown carries them instead, so
 * the row hides them.
 */
export function HeaderTabs({ pathname }: { readonly pathname: string }) {
	return (
		<div data-shell-tabs="" className="hidden items-center gap-6 lg:flex">
			{TABS.map((tab) => {
				const current = isTabPath(tab, pathname)
				return (
					<a
						key={tab.folder}
						href={tabUrl(tab)}
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

/**
 * The sidebar's top block: the way back to the Site Home above the search trigger, then the Tab
 * dropdown Fumadocs renders below `lg` (ADR 0009). The drawer renders the same block, which is why
 * the block carries the hairline the tree starts under.
 */
export function DocsSidebarBanner({ children }: { readonly children?: React.ReactNode }) {
	return (
		<div data-sidebar-top-block="" className="flex flex-col gap-2 border-b p-3">
			{siteHomeButton()}
			<FullSearchTrigger hideIfDisabled />
			<div data-sidebar-tabs="" className="flex flex-wrap items-center gap-2 empty:hidden">
				{children}
			</div>
		</div>
	)
}
