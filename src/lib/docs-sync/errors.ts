/** Stable codes for every rule that can make Docs Sync refuse work. One code per rule. */
export type DocsSyncErrorCode =
	| "PAYLOAD_NOT_OBJECT"
	| "PAYLOAD_FIELD_MISSING"
	| "PAYLOAD_FIELD_INVALID"
	| "PACKAGE_UNSUPPORTED"
	| "MANIFEST_INVALID"
	| "UPSTREAM_TAG_NOT_FOUND"
	| "UPSTREAM_READ_FAILED"
	| "TAG_NOT_REF_SAFE"
	| "BRANCH_NAME_INVALID"
	| "PROTECTED_BRANCH"
	| "GIT_WRITE_FAILED"
	| "PULL_REQUEST_FAILED"
	| "CONFIG_MISSING"

/**
 * The one error type Docs Sync throws, so a caller can branch on `code` instead of on a
 * message. `field` mirrors the path of the caller's input that the rule refused.
 */
export class DocsSyncError extends Error {
	readonly code: DocsSyncErrorCode
	readonly field: string | undefined

	constructor(code: DocsSyncErrorCode, message: string, field?: string) {
		super(message)
		this.name = "DocsSyncError"
		this.code = code
		this.field = field
		Object.freeze(this)
	}
}

/** One line describing any thrown value, for a log a CI engineer can act on. */
export function describeError(error: unknown): string {
	return error instanceof Error ? error.message : String(error)
}

/** The code a refusal carries, or `UNEXPECTED` for a failure that is not one of ours. */
export function errorCodeOf(error: unknown): DocsSyncErrorCode | "UNEXPECTED" {
	return error instanceof DocsSyncError ? error.code : "UNEXPECTED"
}
