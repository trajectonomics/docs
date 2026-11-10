import type { ContentFile } from "./content-pages"
import { contentPathOf, internalLinks, resolvesPagePath } from "./content-pages"
import type { ContentStructureProblem } from "./content-structure"

/** A site-absolute link under `/docs` that has no page behind it. */
function linkProblems(file: ContentFile, files: readonly ContentFile[]): readonly string[] {
	return internalLinks(file.content).filter((link) => !resolvesPagePath(files, contentPathOf(link)))
}

/** Every site-absolute link under `/docs` in an authored page names a page that exists. */
export function linkStructureProblems(
	files: readonly ContentFile[],
): readonly ContentStructureProblem[] {
	return files
		.filter((file) => /\.mdx?$/.test(file.path))
		.flatMap((file) =>
			linkProblems(file, files).map((link) => ({
				rule: "internal-link" as const,
				detail: `${file.path} links to ${link}, which has no page`,
			})),
		)
}
