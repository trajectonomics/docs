import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from "astro"
import { buildMarkdownTwin, MarkdownTwinError } from "../lib/agent"
import { pageWords } from "../lib/agent/page-words"
import { source } from "../lib/source"

export const prerender = true

/** One page the content source publishes. */
type SourcePage = ReturnType<typeof source.getPages>[number]

/**
 * A page's Markdown twin. Astro annotates a thrown error in place, which a frozen domain error
 * refuses, so the adapter rethrows the refusal as the build error that carries its message.
 */
async function twinOf(page: SourcePage): Promise<string> {
	const words = pageWords(page)
	const body = await page.data.getText("raw")
	try {
		return buildMarkdownTwin({ title: words.title, description: words.description, body })
	} catch (error) {
		if (error instanceof MarkdownTwinError) throw new Error(error.message)
		throw error
	}
}

/** Every content page's twin, one static path each, built before the pages render. */
export const getStaticPaths = (async () =>
	await Promise.all(
		source.getPages().map(async (page) => ({
			params: { slug: decodeURI(page.slugs.join("/")) },
			props: { twin: await twinOf(page) },
		})),
	)) satisfies GetStaticPaths

type Props = InferGetStaticPropsType<typeof getStaticPaths>

/** One page's Markdown twin at `<page>.md`. */
export const GET: APIRoute = ({ props }) =>
	new Response((props as Props).twin, {
		headers: { "content-type": "text/markdown; charset=utf-8" },
	})
