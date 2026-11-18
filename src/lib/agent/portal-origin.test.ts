import { describe, expect, test } from "bun:test"
import { PortalOriginError, portalOrigin } from "./portal-origin"

/** The refusal `portalOrigin` answers a build with, or `undefined` when it names one. */
function refusalOf(site: URL | undefined): { code: string; field: string } | undefined {
	try {
		portalOrigin(site)
		return undefined
	} catch (error) {
		return error instanceof PortalOriginError
			? { code: error.code, field: error.field }
			: { code: "not-a-portal-origin-error", field: "" }
	}
}

describe("the Portal's origin at the build boundary", () => {
	test("is the origin of the site astro.config.ts declares", () => {
		expect(portalOrigin(new URL("https://trajectonomics.com/docs/"))).toBe(
			"https://trajectonomics.com",
		)
	})

	test("is refused as SITE_MISSING when the build declares no site, so no twin links absolutely", () => {
		expect(refusalOf(undefined)).toEqual({ code: "SITE_MISSING", field: "site" })
	})
})
