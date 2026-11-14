import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"

/** A JSON string, a `//` line comment, or a block comment; string matches survive, comments do not. */
const JSONC_COMMENT = /("(?:\\.|[^"\\])*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g

function stripComments(text: string): string {
	return text.replace(JSONC_COMMENT, (_match, string: string | undefined) => string ?? "")
}

// Workers Builds reads this file on every deploy, so its deploy shape is a rule, not a taste (ADR 0005).
const config = JSON.parse(
	stripComments(readFileSync(join(import.meta.dir, "..", "wrangler.jsonc"), "utf8")),
)

describe("the Worker config for staging and production", () => {
	test("production deploys the Worker named docs", () => {
		expect(config.name).toBe("docs")
	})

	test("staging deploys its own Worker named docs-staging", () => {
		expect(config.env.staging.name).toBe("docs-staging")
	})

	test("both environments serve the same built assets", () => {
		expect(config.assets.directory).toBe("./dist")
		expect(config.env.staging.assets?.directory ?? config.assets.directory).toBe("./dist")
	})

	test("staging has an explicit empty route list, so the public route can only attach to production", () => {
		expect(config.env.staging.routes).toEqual([])
	})

	test("staging is served on its workers.dev URL", () => {
		expect(config.env.staging.workers_dev).toBe(true)
	})
})

describe("reading the Wrangler config as JSONC", () => {
	test("a comment marker inside a string is part of the string, not a comment", () => {
		expect(JSON.parse(stripComments('{ "url": "https://example.com/docs" }'))).toEqual({
			url: "https://example.com/docs",
		})
	})
})
