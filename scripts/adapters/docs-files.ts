import type { DocsContentStore } from "../../src/lib/docs-sync/deps"
import { parentOf } from "../../src/lib/docs-sync/portal-files"
import type { PortalFile } from "../../src/lib/docs-sync/types"

/** The page and folder-metadata extensions Fumadocs reads. */
const PORTAL_FILE = "{md,mdx,json}"

/**
 * Read the Docs Portal files under one Tab folder from the checkout Docs Sync runs on, plus the
 * Tab's own metadata so a new package folder can be listed there. Paths are repository relative,
 * so a proposal can stage exactly what it read.
 */
export function createDocsFileStore(repoRoot: string): DocsContentStore {
	return {
		async list(contentDir: string): Promise<readonly PortalFile[]> {
			const glob = new Bun.Glob(`${contentDir}/**/*.${PORTAL_FILE}`)
			const paths = new Set<string>()
			for await (const path of glob.scan({ cwd: repoRoot })) {
				paths.add(path)
			}
			const tabMeta = `${parentOf(contentDir)}/meta.json`
			if (await Bun.file(`${repoRoot}/${tabMeta}`).exists()) {
				paths.add(tabMeta)
			}
			const files: PortalFile[] = []
			for (const path of [...paths].sort()) {
				files.push({ path, content: await Bun.file(`${repoRoot}/${path}`).text() })
			}
			return files
		},
	}
}
