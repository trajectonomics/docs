import { describe, expect, test } from "bun:test"
import type { BuiltFile } from "./built-files"
import { checkInstallationPage, INSTALLATION_PAGE_FILE } from "./installation-page"

/**
 * A highlighted code block, as the build produces one: the highlighter splits the line into one
 * `<span>` per token, around a bare text node, and encodes a quote as an entity.
 */
function codeBlock(...tokens: readonly string[]): string {
	const spans = tokens.map((token) => `<span style="--shiki-dark:#E6EDF3">${token}</span>`)
	return (
		'<pre class="min-w-full w-max *:flex *:flex-col"><code><astro-slot name="s0">' +
		`<span class="line">${spans.join("")}</span></astro-slot></code></pre>`
	)
}

/** The line the Installation page gives the reader, split the way the highlighter splits it. */
const PATH_LINE = codeBlock(
	"export",
	" PATH",
	"=",
	"&quot;",
	"$HOME",
	"/.local/bin:",
	"$PATH",
	"&quot;",
)

function installationPage(body: string): BuiltFile {
	return { path: INSTALLATION_PAGE_FILE, content: `<!doctype html><body>${body}</body>` }
}

function codesOf(files: readonly BuiltFile[]): readonly string[] {
	return checkInstallationPage(files).map((failure) => failure.code)
}

describe("the built Installation page", () => {
	test("a code block that puts the install directory on PATH reports no failure", () => {
		expect(codesOf([installationPage(PATH_LINE)])).toEqual([])
	})

	test("a page with no code block reports INSTALLATION_PAGE_PATH_LINE_MISSING", () => {
		expect(codesOf([installationPage('<p>export PATH="$HOME/.local/bin:$PATH"</p>')])).toEqual([
			"INSTALLATION_PAGE_PATH_LINE_MISSING",
		])
	})

	test("a page that names PATH and the directory only in prose reports the missing line", () => {
		const prose =
			"<p>The script does not change your PATH; add ~/.local/bin to it to run traj by name.</p>"

		expect(codesOf([installationPage(`${prose}${codeBlock("traj", " version")}`)])).toEqual([
			"INSTALLATION_PAGE_PATH_LINE_MISSING",
		])
	})

	test("a code block that shows the directory without a PATH assignment reports the missing line", () => {
		expect(codesOf([installationPage(codeBlock("ls", " ~/.local/bin", "/traj"))])).toEqual([
			"INSTALLATION_PAGE_PATH_LINE_MISSING",
		])
	})

	test("a code block that assigns PATH without the install directory reports the missing line", () => {
		expect(
			codesOf([installationPage(codeBlock("export", " PATH", "=", "/opt/bin:$PATH"))]),
		).toEqual(["INSTALLATION_PAGE_PATH_LINE_MISSING"])
	})

	test("the TRAJ_INSTALL_DIR variant of the line satisfies the rule", () => {
		const variant = codeBlock(
			"export",
			" PATH",
			"=",
			"&quot;",
			"$TRAJ_INSTALL_DIR",
			":$PATH",
			"&quot;",
		)

		expect(codesOf([installationPage(variant)])).toEqual([])
	})

	test("a build with no Installation page is left to the required-pages check", () => {
		expect(codesOf([{ path: "docs/cli/index.html", content: "<main></main>" }])).toEqual([])
	})
})
