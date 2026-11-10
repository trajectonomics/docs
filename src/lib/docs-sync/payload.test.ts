import { describe, expect, test } from "bun:test"
import { DocsSyncError } from "./errors"
import { parseUpstreamReleasePayload } from "./payload"

function refusalOf(raw: unknown): DocsSyncError {
	try {
		parseUpstreamReleasePayload(raw)
	} catch (error) {
		if (error instanceof DocsSyncError) {
			return error
		}
		throw error
	}
	throw new Error("expected the payload to be refused")
}

describe("upstream_release payload validation", () => {
	test("a dispatch payload is read as the repository, tag and changelog it carries", () => {
		expect(
			parseUpstreamReleasePayload({
				repo: "trajectonomics/cli",
				tag: "v0.1.0",
				changelog: "- `ledger post` is new",
			}),
		).toEqual({
			repository: "trajectonomics/cli",
			tag: "v0.1.0",
			changelog: "- `ledger post` is new",
		})
	})

	test("a missing or null field is refused, naming that field", () => {
		expect(refusalOf({ tag: "v0.1.0", changelog: "x" })).toMatchObject({
			code: "PAYLOAD_FIELD_MISSING",
			field: "repo",
		})
		expect(refusalOf({ repo: "trajectonomics/cli", tag: null, changelog: "x" })).toMatchObject({
			code: "PAYLOAD_FIELD_MISSING",
			field: "tag",
		})
	})

	test("a field that is not a non-empty string is refused, naming that field", () => {
		expect(refusalOf({ repo: "trajectonomics/cli", tag: "v0.1.0", changelog: 7 })).toMatchObject({
			code: "PAYLOAD_FIELD_INVALID",
			field: "changelog",
		})
		expect(refusalOf({ repo: " ", tag: "v0.1.0", changelog: "x" })).toMatchObject({
			code: "PAYLOAD_FIELD_INVALID",
			field: "repo",
		})
	})

	test("a payload that is not an object is refused", () => {
		expect(refusalOf("upstream_release")).toMatchObject({ code: "PAYLOAD_NOT_OBJECT" })
		expect(refusalOf(null)).toMatchObject({ code: "PAYLOAD_NOT_OBJECT" })
	})
})
