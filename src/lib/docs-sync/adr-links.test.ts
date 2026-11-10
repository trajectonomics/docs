import { describe, expect, test } from "bun:test"
import { rewriteUpstreamAdrLinks } from "./adr-links"

const LOCATION = { repository: "trajectonomics/sim-core", tag: "v0.2.0" }
const ADR_URL = "https://github.com/trajectonomics/sim-core/blob/v0.2.0/docs/adr/0004-balance.md"

describe("upstream ADR links", () => {
	test("a relative upstream ADR link points at GitHub at the released tag", () => {
		expect(rewriteUpstreamAdrLinks("See [ADR 0004](../docs/adr/0004-balance.md).", LOCATION)).toBe(
			`See [ADR 0004](${ADR_URL}).`,
		)
	})

	test("an ADR path written as code becomes a link rather than a copied file", () => {
		expect(rewriteUpstreamAdrLinks("Why: `adr/0004-balance.md`.", LOCATION)).toBe(
			`Why: [adr/0004-balance.md](${ADR_URL}).`,
		)
	})

	test("an anchor survives the rewrite", () => {
		expect(rewriteUpstreamAdrLinks("[why](../adr/0004-balance.md#decision)", LOCATION)).toBe(
			`[why](${ADR_URL}#decision)`,
		)
	})

	test("links that are not upstream ADRs are left exactly as they were", () => {
		const markdown = [
			"[the release](https://github.com/trajectonomics/sim-core/releases/tag/v0.2.0)",
			"[quickstart](./guides/quickstart.md)",
			"`bun run check`",
		].join("\n")
		expect(rewriteUpstreamAdrLinks(markdown, LOCATION)).toBe(markdown)
	})

	test("a local ADR link that is already absolute is not rewritten twice", () => {
		const markdown = `[ADR 0004](${ADR_URL})`
		expect(rewriteUpstreamAdrLinks("See [ADR 0004](../adr/0004-balance.md).", LOCATION)).toContain(
			ADR_URL,
		)
		expect(rewriteUpstreamAdrLinks(markdown, LOCATION)).toBe(markdown)
	})
})
