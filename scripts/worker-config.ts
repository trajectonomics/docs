/** The three Wrangler keys that attach a hostname to a Worker, at any level of the config. */
export const ROUTE_KEYS = ["route", "routes", "custom_domain"] as const

/** A routing key a config scope sets, and the scope that sets it. */
export type DeclaredRoute = { scope: string; key: (typeof ROUTE_KEYS)[number] }

/** One config scope: the top level, or one entry under `env`. */
export type RouteScope = Partial<Record<(typeof ROUTE_KEYS)[number], unknown>>

/** Wrangler accepts a route as a string, as a list, or as an object with a pattern. */
function attachesHostname(value: unknown): boolean {
	if (Array.isArray(value)) return value.length > 0
	if (typeof value === "string") return value.trim().length > 0
	if (typeof value === "object" && value !== null) return true
	return value === true
}

/**
 * Every route a Worker config declares, at the top level and in every `env` entry, so one direct
 * route anywhere fails the guard (ADR 0006). An empty or absent value is not a route.
 */
export function declaredRoutes(config: RouteScope & { env?: Record<string, RouteScope> }) {
	const scopes: [string, RouteScope][] = [["top level", config]]
	for (const [name, environment] of Object.entries(config.env ?? {})) {
		scopes.push([`env.${name}`, environment])
	}

	return scopes.flatMap(([scope, fields]) =>
		ROUTE_KEYS.filter((key) => attachesHostname(fields[key])).map((key) => ({ scope, key })),
	)
}
