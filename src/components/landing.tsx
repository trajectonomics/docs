import { HomeLayout } from "fumadocs-ui/layouts/home"
import { baseOptions } from "../lib/layout.shared"
import { PORTAL_NAME, PORTAL_PURPOSE } from "../lib/portal"
import { SITE_HOME_LOAD, SITE_HOME_PATH } from "../lib/site-home"
import { TABS, tabUrl } from "../lib/tabs"
import { Provider, type ProviderProps } from "./provider"

/** The Source link's destination: this repository. */
const SOURCE_URL = "https://github.com/trajectonomics/docs"

/** The License link's destination: the MIT license this repository ships. */
const LICENSE_URL = `${SOURCE_URL}/blob/main/LICENSE`

/**
 * The Landing Page's own ending: a hairline above Site Home, Source and License, at the bottom of
 * the page body. It is a block of links, not a `<footer>`, because the home layout puts the page
 * body inside `<main>`, where a footer exposes no `contentinfo` landmark.
 */
function LandingEnding() {
	return (
		<div className="mt-auto border-t pt-6">
			<ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-fd-muted-foreground">
				<li>
					<a
						href={SITE_HOME_PATH}
						{...SITE_HOME_LOAD}
						className="transition-colors hover:text-fd-accent-foreground"
					>
						Site Home
					</a>
				</li>
				<li>
					<a href={SOURCE_URL} className="transition-colors hover:text-fd-accent-foreground">
						Source
					</a>
				</li>
				<li>
					<a href={LICENSE_URL} className="transition-colors hover:text-fd-accent-foreground">
						License
					</a>
				</li>
			</ul>
		</div>
	)
}

/** The Landing Page's props: the shell provider's and the release line it shows. */
export interface LandingProps extends ProviderProps {
	/** The line naming the release of `traj` the Operator content was synced from. */
	readonly releaseLine: string
}

/** React island for the Landing Page: the portal name, its purpose, a release line and one entry per audience. */
export function Landing({ releaseLine, ...props }: LandingProps) {
	return (
		<Provider {...props}>
			<HomeLayout {...baseOptions("home")}>
				<div className="mx-auto flex w-full max-w-(--fd-layout-width) flex-1 flex-col gap-8 px-4 py-16 md:px-6">
					<div className="flex flex-col gap-3">
						<h1 className="text-3xl font-semibold tracking-tight">{PORTAL_NAME}</h1>
						<p className="max-w-prose text-fd-muted-foreground">{PORTAL_PURPOSE}</p>
						<p className="text-sm text-fd-muted-foreground">{releaseLine}</p>
					</div>
					<div className="grid gap-4 md:grid-cols-2">
						{TABS.map((tab) => {
							const descriptionId = `${tab.folder}-entry-description`
							return (
								<div
									key={tab.folder}
									className="group relative rounded-md border bg-fd-card p-6 text-lg font-medium text-fd-card-foreground transition-colors hover:bg-fd-accent focus-within:ring-2 focus-within:ring-fd-ring"
								>
									<a
										href={tabUrl(tab)}
										aria-describedby={descriptionId}
										className="outline-none after:absolute after:inset-0 after:rounded-md group-hover:text-fd-accent-foreground"
									>
										{tab.entry}
									</a>
									<p
										id={descriptionId}
										className="mt-2 text-sm font-normal text-fd-muted-foreground"
									>
										{tab.description}
									</p>
								</div>
							)
						})}
					</div>
					<LandingEnding />
				</div>
			</HomeLayout>
		</Provider>
	)
}
