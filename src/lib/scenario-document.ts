import { codeFences } from "./markdown-fences"

/** One Account id a Scenario documents names at a path, for the check that `accounts` declares it. */
export interface ScenarioAccountReference {
	readonly path: string
	readonly account: string
}

/** What a page publishes as a Scenario document, and the required keys its best json fence omits. */
export interface ScenarioDocumentLookup {
	readonly document: Record<string, unknown> | undefined
	readonly missing: readonly string[]
}

/** The keys every Scenario document the CLI accepts carries. */
export const SCENARIO_DOCUMENT_KEYS = [
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

function objectOrEmpty(value: unknown): Record<string, unknown> {
	return isObject(value) ? value : {}
}

function arrayOrEmpty(value: unknown): readonly unknown[] {
	return Array.isArray(value) ? value : []
}

function strings(value: unknown): readonly string[] {
	return arrayOrEmpty(value).filter((item): item is string => typeof item === "string")
}

/** The Scenario document `content` publishes, or the required keys its best json fence omits. */
export function scenarioDocument(content: string): ScenarioDocumentLookup {
	let incomplete: readonly string[] | undefined
	for (const fence of codeFences(content)) {
		if (fence.language !== "json") continue
		let parsed: unknown
		try {
			parsed = JSON.parse(fence.body)
		} catch {
			continue
		}
		if (!isObject(parsed)) continue
		const missing = SCENARIO_DOCUMENT_KEYS.filter((key) => !(key in parsed))
		if (missing.length === 0) return { document: parsed, missing: [] }
		incomplete ??= missing
	}
	return { document: undefined, missing: incomplete ?? SCENARIO_DOCUMENT_KEYS }
}

/** The Account ids `document`'s `accounts` declares. */
export function declaredAccounts(document: Record<string, unknown>): ReadonlySet<string> {
	const ids = arrayOrEmpty(document["accounts"]).flatMap((account) => {
		const id = objectOrEmpty(account)["id"]
		return typeof id === "string" ? [id] : []
	})
	return new Set(ids)
}

/** Every Account id `document` routes to or targets, each with the path that names it. */
export function accountReferences(
	document: Record<string, unknown>,
): readonly ScenarioAccountReference[] {
	const cashflow = objectOrEmpty(document["cashflow"])
	const steps = arrayOrEmpty(cashflow["surplus"]).flatMap((step, index) => {
		const account = objectOrEmpty(step)["account"]
		const path = `cashflow.surplus[${index}].account`
		return typeof account === "string" ? [{ path, account }] : []
	})
	const routes = (["contribute", "withdraw"] as const).flatMap((key) =>
		strings(cashflow[key]).map((account, index) => ({
			path: `cashflow.${key}[${index}]`,
			account,
		})),
	)
	const targets = arrayOrEmpty(document["flows"]).flatMap((flow, index) => {
		const account = objectOrEmpty(flow)["target"]
		const path = `flows[${index}].target`
		return typeof account === "string" ? [{ path, account }] : []
	})
	return [...steps, ...routes, ...targets]
}
