import { DOCS_BASE_PATH } from "../tabs"

/** One file of the built Docs Portal, at a path relative to the Worker's assets root (`dist/`). */
export interface BuiltFile {
	readonly path: string
	readonly content: string
}

const DOCS_DIR = DOCS_BASE_PATH.slice(1)

/** The slug of a built `index.html` below the Docs Portal's base, or `undefined` for another file. */
export function builtPageSlug(path: string): string | undefined {
	if (!path.startsWith(`${DOCS_DIR}/`) || !path.endsWith("/index.html")) return undefined
	return path.slice(DOCS_DIR.length + 1, -"index.html".length).replace(/\/$/, "")
}

/** The file at one assets-root-relative path, or `undefined` when the build produced none. */
export function fileAt(files: readonly BuiltFile[], path: string): BuiltFile | undefined {
	return files.find((file) => file.path === path)
}
