import type { APIRoute, GetStaticPaths } from "astro"
import { buildMarkdownTwin } from "../lib/agent"
import { source } from "../lib/source"

export const prerender = true

export const getStaticPaths = (async () =>
	await Promise.all(
		source.getPages().map(async (page) => {
			const title = page.data.title
			if (title === undefined) {
				throw new Error(`${page.url} has no frontmatter title, so it has no Markdown twin`)
			}
			return {
				params: { slug: decodeURI(page.slugs.join("/")) },
				props: {
					twin: buildMarkdownTwin({
						title,
						description: page.data.description,
						body: await page.data.getText("raw"),
					}),
				},
			}
		}),
	)) satisfies GetStaticPaths

/** One page's Markdown twin at `<page>.md`, built from the authored source before the page renders. */
export const GET: APIRoute = ({ props }) =>
	new Response((props as { twin: string }).twin, {
		headers: { "content-type": "text/markdown; charset=utf-8" },
	})
