import { existsSync } from "node:fs"
import type { BuiltFile } from "../../src/lib/build"

/**
 * Read every file under the build output root, keyed by its path relative to that root
 * (`docs/404.html`, `_redirects`). A missing root reads as no files, so the checker reports it.
 */
export async function readBuildFiles(root: string): Promise<readonly BuiltFile[]> {
	if (!existsSync(root)) return []
	const paths: string[] = []
	for await (const path of new Bun.Glob("**/*").scan({ cwd: root })) {
		paths.push(path)
	}
	paths.sort()
	const files: BuiltFile[] = []
	for (const path of paths) {
		files.push({ path, content: await Bun.file(`${root}/${path}`).text() })
	}
	return files
}
