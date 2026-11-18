import { PORTAL_NAME, PORTAL_PURPOSE } from "../portal"
import { TABS, tabUrl } from "../tabs"
import { portalUrl } from "./portal-url"
import { twinPath } from "./twin-path"

/** The Markdown twin of the Landing Page, from the constants the page renders and the release line it shows. */
export function buildLandingTwin(releaseLine: string): string {
	const entries = TABS.flatMap((tab) => [
		`## ${tab.entry}`,
		"",
		`- [${tab.title}](${portalUrl(twinPath(tabUrl(tab)))}): ${tab.description}`,
		"",
	])
	return [`# ${PORTAL_NAME}`, "", `> ${PORTAL_PURPOSE}`, "", releaseLine, "", ...entries].join("\n")
}
