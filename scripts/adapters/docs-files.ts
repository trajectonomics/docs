import type { DocsContentStore } from "../../src/lib/docs-sync/deps"
import type { PortalFile } from "../../src/lib/docs-sync/types"

/** The page and folder-metadata extensions Fumadocs reads. */
const PORTAL_FILE = "{md,mdx,json}"

/**
 * Read the Docs Portal files under one Tab folder from the checkout Docs Sync runs on. Paths are
 * repository relative, so a proposal can stage exactly what it read.
 */
export function createDocsFileStore(repoRoot: string): DocsContentStore {
	return {
		async list(contentDir: string): Promise<readonly PortalFile[]> {
			const glob = new Bun.Glob(`${contentDir}/**/*.${PORTAL_FILE}`)
			const files: PortalFile[] = []
			for await (const path of glob.scan({ cwd: repoRoot })) {
				files.push({ path, content: await Bun.file(`${repoRoot}/${path}`).text() })
			}
			return files.sort((left, right) => left.path.localeCompare(right.path))
		},
	}
}
