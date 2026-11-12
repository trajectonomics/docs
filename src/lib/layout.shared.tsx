import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared"
import { DOCS_BASE_PATH } from "./tabs"

/** Layout options shared by every Docs Portal page. */
export function baseOptions(): BaseLayoutProps {
	return { nav: { title: "Trajectonomics Docs", url: `${DOCS_BASE_PATH}/` } }
}
