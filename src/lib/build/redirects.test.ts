import { describe, expect, test } from "bun:test"
import { renderWorkerRedirects } from "../worker-redirects"
import type { BuiltFile } from "./built-files"
import { checkRedirects, REDIRECTS_FILE } from "./redirects"

function redirectsFile(content: string): BuiltFile {
	return { path: REDIRECTS_FILE, content }
}

describe("the built redirect rules", () => {
	test("the rules renderWorkerRedirects produces report no failure", () => {
		expect(checkRedirects([redirectsFile(renderWorkerRedirects())])).toEqual([])
	})

	test("a build with no redirect rules is reported as REDIRECT_RULES_MISSING", () => {
		expect(checkRedirects([]).map((failure) => failure.code)).toEqual(["REDIRECT_RULES_MISSING"])
	})

	test("redirect rules that differ from the Worker's are reported as REDIRECT_RULES_MISMATCH", () => {
		expect(
			checkRedirects([redirectsFile("/docs /docs/developers/ 302\n")]).map(
				(failure) => failure.code,
			),
		).toEqual(["REDIRECT_RULES_MISMATCH"])
	})
})
