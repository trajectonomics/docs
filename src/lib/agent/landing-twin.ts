import { PORTAL_NAME, PORTAL_PURPOSE } from "../portal"
import { TABS, tabUrl } from "../tabs"
import { indexReference } from "./index-reference"
import { twinUrl } from "./twin-url"

/** The Markdown twin of the Landing Page, from the constants the page renders and the release line it shows. */
export function buildLandingTwin(releaseLine: string, origin: string): string {
	const entries = TABS.flatMap((tab) => [
		`## ${tab.entry}`,
		"",
		`- [${tab.title}](${twinUrl(origin, tabUrl(tab))}): ${tab.description}`,
		"",
	])
	return [
		`# ${PORTAL_NAME}`,
		"",
		`> ${PORTAL_PURPOSE}`,
		"",
		releaseLine,
		"",
		...entries,
		indexReference(origin),
		"",
	].join("\n")
}
