import type { APIRoute } from "astro"
import { buildLandingTwin, portalOrigin, runBuildStep } from "../lib/agent"
import { trackedReleaseLine } from "../lib/tracked-release-line"

export const prerender = true

/** The Landing Page's Markdown twin at `/docs/index.md`, from the constants the page renders. */
export const GET: APIRoute = ({ site }) =>
	runBuildStep(
		() =>
			new Response(buildLandingTwin(trackedReleaseLine(), portalOrigin(site)), {
				headers: { "content-type": "text/markdown; charset=utf-8" },
			}),
	)
