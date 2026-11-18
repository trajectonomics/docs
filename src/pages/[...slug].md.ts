import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from "astro"
import { buildMarkdownTwin, pageWords, portalOrigin, runBuildStep } from "../lib/agent"
import { source } from "../lib/source"

export const prerender = true

/** One page the content source publishes. */
type SourcePage = ReturnType<typeof source.getPages>[number]

/** A page's Markdown twin, from its authored words, its body and the origin the build serves. */
async function twinOf(page: SourcePage, origin: string): Promise<string> {
	const words = pageWords(page)
	const body = await page.data.getText("raw")
	return buildMarkdownTwin({ title: words.title, description: words.description, body }, origin)
}

/** Every content page's twin, one static path each. */
export const getStaticPaths = (() =>
	source.getPages().map((page) => ({
		params: { slug: decodeURI(page.slugs.join("/")) },
		props: { page },
	}))) satisfies GetStaticPaths

type Props = InferGetStaticPropsType<typeof getStaticPaths>

/** One page's Markdown twin at `<page>.md`, from its authored source. */
export const GET: APIRoute = async ({ props, site }) => {
	const { page } = props as Props
	const twin = await runBuildStep(() => twinOf(page, portalOrigin(site)))
	return new Response(twin, {
		headers: { "content-type": "text/markdown; charset=utf-8" },
	})
}
