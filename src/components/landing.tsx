import { HomeLayout } from "fumadocs-ui/layouts/home"
import { baseOptions, PORTAL_NAME, PORTAL_PURPOSE } from "../lib/layout.shared"
import { TABS, tabUrl } from "../lib/tabs"
import { Provider, type ProviderProps } from "./provider"

/** React island for the Landing Page: the portal name, its purpose and one entry per audience. */
export function Landing(props: ProviderProps) {
	return (
		<Provider {...props}>
			<HomeLayout {...baseOptions()}>
				<div className="mx-auto flex w-full max-w-(--fd-layout-width) flex-col gap-8 px-4 py-16 md:px-6">
					<div className="flex flex-col gap-3">
						<h1 className="text-3xl font-semibold tracking-tight">{PORTAL_NAME}</h1>
						<p className="max-w-prose text-fd-muted-foreground">{PORTAL_PURPOSE}</p>
					</div>
					<div className="grid gap-4 md:grid-cols-2">
						{TABS.map((tab) => (
							<a
								key={tab.folder}
								href={tabUrl(tab)}
								className="rounded-lg border bg-fd-card p-6 text-lg font-medium text-fd-card-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
							>
								{tab.entry}
							</a>
						))}
					</div>
				</div>
			</HomeLayout>
		</Provider>
	)
}
