import { navigate } from "astro:transitions/client"
import { RootProvider } from "fumadocs-ui/provider/astro"
import type { ReactNode } from "react"
import SearchDialog from "./search"

export interface ProviderProps {
	/** `Astro.url.pathname` */
	pathname: string
	/** `Astro.params` */
	params: Record<string, string | undefined>
	children?: ReactNode
}

/** Fumadocs root provider wired to the local static search dialog. */
export function Provider({ pathname, params, children }: ProviderProps) {
	return (
		<RootProvider pathname={pathname} params={params} navigate={navigate} search={{ SearchDialog }}>
			{children}
		</RootProvider>
	)
}
