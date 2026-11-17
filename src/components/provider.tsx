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
		<RootProvider
			pathname={pathname}
			params={params}
			navigate={navigate}
			search={{ SearchDialog }}
			// next-themes emits both attributes, so the design-system Theme CSS
			// (scoped to [data-theme]) follows the same toggle as Fumadocs' .dark class.
			// The Docs Portal exposes the dark Theme only while the organisation ships one look
			// (the owner reversed the light-only decision on 17 Nov 2026, docs#89): `forcedTheme`
			// is applied before the stored preference and the device's scheme are read, so both
			// lose, and `hotKey` off leaves no shortcut that flips nothing. The light Theme CSS
			// stays loaded: light's return deletes these three values and re-enables the switch
			// in lib/layout.shared.tsx.
			theme={{
				attribute: ["class", "data-theme"],
				forcedTheme: "dark",
				enableSystem: false,
				hotKey: false,
			}}
		>
			{children}
		</RootProvider>
	)
}
