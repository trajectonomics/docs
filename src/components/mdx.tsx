import { DocsBody } from "fumadocs-ui/layouts/notebook/page"
import defaultMdxComponents from "fumadocs-ui/mdx"
import type { MDXComponents } from "mdx/types"

/** MDX components of the Docs Portal pages. */
export function getMDXComponents(components?: MDXComponents): MDXComponents {
	return { ...defaultMdxComponents, ...components }
}

// `wrapper` gives the content its prose styles (Fumadocs Astro integration).
export default getMDXComponents({ wrapper: DocsBody })
