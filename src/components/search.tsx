import { useStaticSearch } from "fumadocs-core/search/client"
import {
	SearchDialog,
	SearchDialogClose,
	SearchDialogContent,
	SearchDialogHeader,
	SearchDialogIcon,
	SearchDialogInput,
	SearchDialogList,
	SearchDialogOverlay,
	type SharedProps,
} from "fumadocs-ui/components/dialog/search"
import { SEARCH_INDEX_PATH } from "../lib/tabs"

/** Search dialog backed by the static index served from this site; no third-party call. */
export default function DocsSearchDialog(props: SharedProps) {
	const search = useStaticSearch({ from: SEARCH_INDEX_PATH })

	return (
		<SearchDialog {...search} {...props}>
			<SearchDialogOverlay />
			<SearchDialogContent>
				<SearchDialogHeader>
					<SearchDialogIcon />
					<SearchDialogInput />
					<SearchDialogClose />
				</SearchDialogHeader>
				<SearchDialogList />
			</SearchDialogContent>
		</SearchDialog>
	)
}
