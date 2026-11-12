import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared"
import { DOCS_BASE_PATH } from "./tabs"

/** The Docs Portal's name, shown in the header and as the Landing Page heading. */
export const PORTAL_NAME = "Trajectonomics Docs"

/** The one sentence that says what the Docs Portal is for. */
export const PORTAL_PURPOSE =
	"Documentation for running the Trajectonomics CLI and building on its packages."

/** Layout options shared by every Docs Portal page. */
export function baseOptions(): BaseLayoutProps {
	return { nav: { title: PORTAL_NAME, url: `${DOCS_BASE_PATH}/` } }
}
