import { type ContentFile, PAGE_EXTENSIONS } from "../content-pages"
import { COMMAND_REFERENCE_ROOT, type PageSection } from "./sections"

/** The path a top-level command's page has, whether or not a page is there. */
export function pagePathFor(topLevel: string, extension: string = PAGE_EXTENSIONS[0]): string {
	return `${COMMAND_REFERENCE_ROOT}/${topLevel}${extension}`
}

/** The page that documents a top-level command, or undefined when no page names it. */
export function pageOf(files: readonly ContentFile[], topLevel: string): ContentFile | undefined {
	return files.find((file) =>
		PAGE_EXTENSIONS.some((extension) => file.path === pagePathFor(topLevel, extension)),
	)
}

/** The pages of the command reference, in the order they were read. */
export function commandReferencePages(files: readonly ContentFile[]): readonly ContentFile[] {
	return files.filter(
		(file) =>
			file.path.startsWith(`${COMMAND_REFERENCE_ROOT}/`) &&
			PAGE_EXTENSIONS.some((extension) => file.path.endsWith(extension)),
	)
}

/** The flags a page documents for one released leaf, or undefined when it has no section for it. */
export function documentedFlags(
	sections: readonly PageSection[],
	leaf: string,
): readonly string[] | undefined {
	if (!leaf.includes(" ")) {
		return sections.flatMap((section) => section.flags)
	}
	return sections.find((section) => section.leaf === leaf)?.flags
}
