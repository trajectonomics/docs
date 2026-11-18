import { describe, expect, test } from "bun:test"
import { portalOrigin } from "./portal-origin"

describe("the Portal's origin at the build boundary", () => {
	test("is the origin of the site astro.config.ts declares", () => {
		expect(portalOrigin(new URL("https://trajectonomics.com/docs/"))).toBe(
			"https://trajectonomics.com",
		)
	})

	test("is refused when the build declares no site, so no twin links absolutely", () => {
		expect(() => portalOrigin(undefined)).toThrow("astro.config.ts has no site")
	})
})
