import { describe, expect, test } from "bun:test"
import type { BuiltFile } from "./built-files"
import { aliasFile, checkTabAliases } from "./tab-aliases"

/** A built redirect stub that sends the reader to `target`. */
function stub(path: string, target: string): BuiltFile {
	return {
		path,
		content: `<!doctype html><title>Redirecting</title><meta http-equiv="refresh" content="0;url=${target}">`,
	}
}

/** The build output of a site whose two audience names redirect to their Tabs. */
function aliases(): BuiltFile[] {
	return [
		stub(aliasFile("/operators"), "/docs/cli/"),
		stub(aliasFile("/builders"), "/docs/developers/"),
	]
}

function codesOf(files: readonly BuiltFile[]): readonly string[] {
	return checkTabAliases(files).map((failure) => failure.code)
}

describe("the audience names a reader may type", () => {
	test("each one redirects to the Tab it names", () => {
		expect(checkTabAliases(aliases())).toEqual([])
	})

	test("one the build did not produce is reported as TAB_ALIAS_MISSING", () => {
		expect(codesOf(aliases().slice(1))).toEqual(["TAB_ALIAS_MISSING"])
	})

	test("one that sends readers to another page is reported as TAB_ALIAS_TARGET", () => {
		expect(codesOf([stub(aliasFile("/operators"), "/docs/"), aliases()[1]!])).toEqual([
			"TAB_ALIAS_TARGET",
		])
	})

	test("one that is a real page rather than a redirect is reported", () => {
		const page: BuiltFile = {
			path: aliasFile("/builders"),
			content: "<html><body>Hi</body></html>",
		}
		expect(codesOf([aliases()[0]!, page])).toEqual(["TAB_ALIAS_TARGET"])
	})

	test("the failure names the file a maintainer edits", () => {
		const [failure] = checkTabAliases(aliases().slice(1))
		expect(failure?.path).toBe("docs/operators/index.html")
		expect(failure?.message).toBe("the build did not produce the redirect for /operators")
	})
})
