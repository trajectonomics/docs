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

/** The three Wrangler keys that attach a hostname to a Worker, at any level of the config. */
const ROUTE_KEYS = ["route", "routes", "custom_domain"] as const

/** A config scope: the top level, or one entry under `env`. */
type RouteScope = Partial<Record<(typeof ROUTE_KEYS)[number], unknown>>

/** True when a value attaches a hostname: a non-empty string or list, or `custom_domain: true`. */
function attachesHostname(value: unknown): boolean {
	if (Array.isArray(value)) return value.length > 0
	if (typeof value === "string") return value.length > 0
	return value === true
}

/**
 * Every route the config declares, as `<scope> <key>`, so one direct route anywhere fails the guard
 * (ADR 0006). An empty or absent value is not a route; a non-empty one is.
 */
function directRoutesDeclared(workerConfig: RouteScope & { env?: Record<string, RouteScope> }) {
	const scopes: [string, RouteScope][] = [["top level", workerConfig]]
	for (const [name, environment] of Object.entries(workerConfig.env ?? {})) {
		scopes.push([`env.${name}`, environment])
	}

	return scopes.flatMap(([scope, fields]) =>
		ROUTE_KEYS.filter((key) => attachesHostname(fields[key])).map((key) => `${scope} ${key}`),
	)
}

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

	test("a route field set anywhere is reported, so a direct route cannot land unnoticed", () => {
		const directRoute = {
			routes: ["trajectonomics.com/docs/*"],
			env: {
				staging: { route: "trajectonomics.com/docs" },
				production: { custom_domain: true },
			},
		}

		expect(directRoutesDeclared(directRoute)).toEqual([
			"top level routes",
			"env.staging route",
			"env.production custom_domain",
		])
	})

	test("the shipped Worker config declares no route at any level", () => {
		expect(directRoutesDeclared(config)).toEqual([])
	})

	test("staging is served on its workers.dev URL", () => {
		expect(config.env.staging.workers_dev).toBe(true)
	})
})
