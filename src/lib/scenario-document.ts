import { codeFences } from "./content-fences"

/** One Account id a Scenario documents names at a path, for the check that `accounts` declares it. */
export interface ScenarioAccountReference {
	readonly path: string
	readonly account: string
}

/** The keys every Scenario document the CLI accepts carries. */
const DOCUMENT_KEYS = [
	"schemaVersion",
	"currency",
	"economy",
	"accounts",
	"flows",
	"cashflow",
] as const

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value)
}

function object(value: unknown): Record<string, unknown> {
	return isObject(value) ? value : {}
}

function list(value: unknown): readonly unknown[] {
	return Array.isArray(value) ? value : []
}

function strings(value: unknown): readonly string[] {
	return list(value).filter((item): item is string => typeof item === "string")
}

/** The Scenario document `content` publishes: its first json fence carrying every required key. */
export function scenarioDocument(content: string): Record<string, unknown> | undefined {
	for (const fence of codeFences(content)) {
		if (fence.language !== "json") continue
		let parsed: unknown
		try {
			parsed = JSON.parse(fence.body)
		} catch {
			continue
		}
		if (isObject(parsed) && DOCUMENT_KEYS.every((key) => key in parsed)) return parsed
	}
	return undefined
}

/** The Account ids `document`'s `accounts` declares. */
export function declaredAccounts(document: Record<string, unknown>): ReadonlySet<string> {
	const ids = list(document["accounts"]).flatMap((account) => {
		const id = object(account)["id"]
		return typeof id === "string" ? [id] : []
	})
	return new Set(ids)
}

/** Every Account id `document` routes to or targets, each with the path that names it. */
export function accountReferences(
	document: Record<string, unknown>,
): readonly ScenarioAccountReference[] {
	const cashflow = object(document["cashflow"])
	const steps = list(cashflow["surplus"]).flatMap((step, index) => {
		const account = object(step)["account"]
		const path = `cashflow.surplus[${index}].account`
		return typeof account === "string" ? [{ path, account }] : []
	})
	const routes = (["contribute", "withdraw"] as const).flatMap((key) =>
		strings(cashflow[key]).map((account, index) => ({
			path: `cashflow.${key}[${index}]`,
			account,
		})),
	)
	const targets = list(document["flows"]).flatMap((flow, index) => {
		const account = object(flow)["target"]
		const path = `flows[${index}].target`
		return typeof account === "string" ? [{ path, account }] : []
	})
	return [...steps, ...routes, ...targets]
}
