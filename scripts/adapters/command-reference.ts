import { existsSync } from "node:fs"
import { mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import {
	COMMAND_REFERENCE_ROOT,
	type ContentFile,
	PAGE_EXTENSIONS,
} from "../../src/lib/command-reference"
import type { CommandReferenceDeps } from "../command-reference/deps"

/** The npm registry's `dist-tags` document, which names the release `latest`. */
const DIST_TAGS = "https://registry.npmjs.org/-/package/@trajectonomics/cli/dist-tags"

/** The command reference's folder relative to the repository root. */
const ROOT = COMMAND_REFERENCE_ROOT

/** The glob that matches every page extension Fumadocs reads, such as `*.{mdx,md}`. */
const PAGE_GLOB = `*.{${PAGE_EXTENSIONS.map((extension) => extension.slice(1)).join(",")}}`

/** Whether `path` names a page Fumadocs reads. */
function isPage(path: string): boolean {
	return PAGE_EXTENSIONS.some((extension) => path.endsWith(extension))
}

/** The version npm's `latest` tag names, or undefined while the registry cannot serve it. */
async function latestVersion(): Promise<string | undefined> {
	const response = await fetch(DIST_TAGS).catch(() => undefined)
	if (response === undefined || !response.ok) return undefined
	const tags: unknown = await response.json().catch(() => undefined)
	const latest =
		typeof tags === "object" && tags !== null
			? (tags as Record<string, unknown>)["latest"]
			: undefined
	return typeof latest === "string" ? latest : undefined
}

/** The published CLI over `bunx`, spawned in a temporary directory away from the repository's lockfile. */
function cliRunner(): Pick<CommandReferenceDeps, "cliJson" | "cliText"> {
	let directory: Promise<string> | undefined
	const workingDirectory = (): Promise<string> => {
		directory ??= mkdtemp(join(tmpdir(), "command-reference-"))
		return directory
	}
	const run = async (version: string, args: readonly string[]): Promise<string | undefined> => {
		const child = Bun.spawn(["bunx", `@trajectonomics/cli@${version}`, ...args], {
			cwd: await workingDirectory(),
			stdout: "pipe",
			stderr: "pipe",
		})
		const [stdout] = await Promise.all([
			new Response(child.stdout).text(),
			new Response(child.stderr).text(),
		])
		return (await child.exited) === 0 ? stdout : undefined
	}
	return {
		cliText: run,
		async cliJson(version: string, args: readonly string[]): Promise<unknown> {
			const text = await run(version, args)
			if (text === undefined) return undefined
			try {
				return JSON.parse(text)
			} catch {
				return undefined
			}
		},
	}
}

/** Every command-reference page under `root`, sorted by path, or undefined when the folder is absent. */
async function readPages(root: string): Promise<readonly ContentFile[] | undefined> {
	if (!existsSync(join(root, ROOT))) return undefined
	const files: ContentFile[] = []
	for await (const path of new Bun.Glob(`${ROOT}/**/${PAGE_GLOB}`).scan({ cwd: root })) {
		files.push({ path, content: await Bun.file(join(root, path)).text() })
	}
	return files.sort((left, right) => left.path.localeCompare(right.path))
}

/** One git read, or undefined when git refused it. */
function git(args: readonly string[]): string | undefined {
	const result = Bun.spawnSync(["git", ...args], { stdout: "pipe", stderr: "pipe" })
	return result.exitCode === 0 ? result.stdout.toString() : undefined
}

/** The command-reference pages at a git ref, read through git so no checkout is moved. */
async function pagesAt(ref: string): Promise<readonly ContentFile[] | undefined> {
	const listed = git(["ls-tree", "-r", "--name-only", ref, "--", ROOT])
	if (listed === undefined) return undefined
	const files: ContentFile[] = []
	for (const path of listed.split("\n").filter(isPage)) {
		const content = git(["show", `${ref}:${path}`])
		if (content === undefined) return undefined
		files.push({ path, content })
	}
	return files.sort((left, right) => left.path.localeCompare(right.path))
}

/** Assemble the check over the npm registry, `bunx`, git and the checkout's files. */
export function createCommandReferenceDeps(): CommandReferenceDeps {
	return {
		now: () => Date.now(),
		sleep: (ms: number) => Bun.sleep(ms),
		print: (line: string) => console.log(line),
		latestVersion,
		...cliRunner(),
		pages: () => readPages(process.cwd()),
		pagesAt,
	}
}
