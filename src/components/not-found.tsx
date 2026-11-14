import { HomeLayout } from "fumadocs-ui/layouts/home"
import { baseOptions } from "../lib/layout.shared"
import { NOT_FOUND_BODY_ID } from "../lib/not-found"
import { DOCS_BASE_PATH } from "../lib/tabs"
import { Provider, type ProviderProps } from "./provider"

/** React island for the 404 page: the home shell header, its search, and a way back to the Landing Page. */
export function NotFound(props: ProviderProps) {
	return (
		<Provider {...props}>
			<HomeLayout {...baseOptions("home")}>
				<div
					id={NOT_FOUND_BODY_ID}
					className="mx-auto flex w-full max-w-(--fd-layout-width) flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center md:px-6"
				>
					<h1 className="text-3xl font-semibold tracking-tight">Page not found</h1>
					<p className="max-w-md text-fd-muted-foreground">
						The page you were looking for does not exist. Go back to the{" "}
						<a className="text-fd-foreground underline" href={`${DOCS_BASE_PATH}/`}>
							Docs Portal
						</a>
						.
					</p>
				</div>
			</HomeLayout>
		</Provider>
	)
}
