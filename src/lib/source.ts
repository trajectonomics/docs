import { getCollection } from "astro:content"
import { toFumadocsSource } from "@fumadocs/astro/source"
import { loader } from "fumadocs-core/source"
import { DOCS_BASE_PATH } from "./tabs"

/** The Fumadocs source over the authored Docs Portal pages. */
export const source = loader({
	source: toFumadocsSource(await getCollection("docs"), await getCollection("meta")),
	baseUrl: DOCS_BASE_PATH,
})
