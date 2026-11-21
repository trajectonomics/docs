/**
 * The line every page with a Markdown twin carries for an Agent, never for a reader: the words
 * before its two links, the names the links are read by, and the separator between them. Pure, so a
 * test asserts the pointer an Agent meets without loading the page (ADR 0010).
 */

/** The words the line shows before its two links. */
export const AGENT_LINE_PREFIX = "For AI agents: this page as"

/** The name of the line's link to the page's Markdown twin. */
export const MARKDOWN_LINK_NAME = "Markdown"

/** The name of the line's link to the Docs index, the file an Agent reads first. */
export const DOCS_INDEX_LINK_NAME = "Docs index"

/** The separator the line shows between its two links. */
export const AGENT_LINE_SEPARATOR = "·"

/**
 * Attributes that load a twin or the Docs index as its own document: neither is a page the Client
 * Router can swap in, so neither is prefetched or intercepted (ADR 0010).
 */
export const AGENT_LINE_LOAD = {
	"data-astro-reload": true,
	"data-astro-prefetch": "false",
} as const
