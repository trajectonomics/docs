import { describe, expect, test } from "bun:test"
import { readFileSync } from "node:fs"
import { join } from "node:path"
import { declaredRoutes } from "./worker-config"

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

	test("staging sets routes to an explicit empty list, so any route added later cannot attach to it", () => {
		expect(config.env.staging.routes).toEqual([])
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

	test("staging is served on its workers.dev URL", () => {
		expect(config.env.staging.workers_dev).toBe(true)
	})
})
