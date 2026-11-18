import glyph from "@trajectonomics/design-system-assets/logo/mark.svg?raw"
import type { ComponentProps } from "react"
import { PORTAL_NAME } from "../lib/portal"

/** The attributes the artwork names itself with; the anchor carries the name instead. */
const ARTWORK_NAME = /\s(?:role|aria-label)="[^"]*"/g

/** The artwork's own `<title>`, which would name the link a second time. */
const ARTWORK_TITLE = /<title>[\s\S]*?<\/title>/

const ARTWORK_OPEN = /<svg\b/

/**
 * The Site's glyph as decoration: the anchor names the link, so the SVG keeps no role, no
 * accessible name and no title, and assistive technology skips it.
 */
function decoration(artwork: string): string {
	return artwork
		.replace(ARTWORK_TITLE, "")
		.replace(ARTWORK_NAME, "")
		.replace(ARTWORK_OPEN, '<svg aria-hidden="true" focusable="false"')
}

/** The Docs Portal's header mark: the Site's glyph on a tile, in the link to the Landing Page. */
export function HeaderMark({ href, className }: ComponentProps<"a">) {
	return (
		<a href={href} aria-label={PORTAL_NAME} className={className}>
			<span
				className="inline-flex size-8 items-center justify-center rounded-md bg-fd-primary text-fd-primary-foreground [&_svg]:size-5"
				dangerouslySetInnerHTML={{ __html: decoration(glyph) }}
			/>
		</a>
	)
}
