import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { declaredRoutes } from "./worker-config"

/** A JSON string, a `//` line comment, or a block comment; string matches survive, comments do not. */
const JSONC_COMMENT = /("(?:\\.|[^"\\])*")|\/\/[^\n]*|\/\*[\s\S]*?\*\//g

function stripComments(text: string): string {
	return text.replace(JSONC_COMMENT, (_match, string: string | undefined) => string ?? "")
}

// Workers Builds reads this file on every deploy, so its deploy shape is a rule, not a taste (ADR 0007).
const config = JSON.parse(
	stripComments(readFileSync(join(import.meta.dir, "..", "wrangler.jsonc"), "utf8")),
)

describe("the Worker config", () => {
	test("the Worker is named docs", () => {
		expect(config.name).toBe("docs")
	})

	test("serves the built assets from ./dist", () => {
		expect(config.assets.directory).toBe("./dist")
	})

	test("declares no Wrangler environment, so there is one Worker to deploy", () => {
		expect(config.env).toBeUndefined()
	})

	test("a route set at the top level or in an environment is a declared route", () => {
		const directRoute = {
			routes: ["trajectonomics.com/docs/*"],
			env: {
				staging: { route: { pattern: "trajectonomics.com/docs", zone_name: "trajectonomics.com" } },
				production: { custom_domain: true },
			},
		}

		expect(declaredRoutes(directRoute)).toEqual([
			{ scope: "top level", key: "routes" },
			{ scope: "env.staging", key: "route" },
			{ scope: "env.production", key: "custom_domain" },
		])
	})

	test("an empty route list is not a declared route", () => {
		expect(declaredRoutes({ routes: [], env: { staging: { routes: [] } } })).toEqual([])
	})

	test("the shipped Worker config declares no route at any level", () => {
		expect(declaredRoutes(config)).toEqual([])
	})
})
