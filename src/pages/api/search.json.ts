import type { APIRoute } from "astro"
import { createFromSource } from "fumadocs-core/search/server"
import { source } from "../../lib/source"

export const prerender = true

const server = createFromSource(source, { language: "english" })

/** Static search index, exported at build time and queried in the browser. */
export const GET: APIRoute = () => server.staticGET()
