import { DocsSyncError } from "./errors"

/** The `upstream_release` dispatch payload, after every field is known to be usable. */
export interface UpstreamReleasePayload {
	/** The Upstream Package repository that published, e.g. `trajectonomics/cli`. */
	readonly repository: string
	readonly tag: string
	readonly changelog: string
}

/** A dispatch field key, as the Upstream Package sends it. */
type PayloadField = "repo" | "tag" | "changelog"

/** The payload as a plain object, refusing anything else. */
function asRecord(raw: unknown): Record<string, unknown> {
	if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
		throw new DocsSyncError(
			"PAYLOAD_NOT_OBJECT",
			`an upstream_release payload must be an object, got ${typeof raw}`,
		)
	}
	return raw as Record<string, unknown>
}

/** One dispatch field, refusing a missing or blank one; `field` names the caller's key. */
function fieldOf(payload: Record<string, unknown>, field: PayloadField): string {
	const value = payload[field]
	if (value === undefined || value === null) {
		throw new DocsSyncError(
			"PAYLOAD_FIELD_MISSING",
			`the upstream_release payload is missing ${field}`,
			field,
		)
	}
	if (typeof value !== "string" || value.trim().length === 0) {
		throw new DocsSyncError(
			"PAYLOAD_FIELD_INVALID",
			`${field} must be a non-empty string, got ${JSON.stringify(value)}`,
			field,
		)
	}
	return value
}

/** Read the `upstream_release` payload, refusing malformed input before any state changes. */
export function parseUpstreamReleasePayload(raw: unknown): UpstreamReleasePayload {
	const payload = asRecord(raw)
	return Object.freeze({
		repository: fieldOf(payload, "repo"),
		tag: fieldOf(payload, "tag"),
		changelog: fieldOf(payload, "changelog"),
	})
}
