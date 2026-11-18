import { describe, expect, test } from "bun:test"
import type { ContentFile } from "./content-pages"
import { typescriptPrograms } from "./content-programs"

function page(block: string): ContentFile {
	return { path: "developers/sim-core/index.mdx", content: block }
}

describe("TypeScript programs in a Docs Portal page", () => {
	test("a ts fence is one program", () => {
		expect(typescriptPrograms(page("```ts\nconst a = 1\n```\n"))).toEqual(["const a = 1"])
	})

	test("a typescript fence is one program", () => {
		expect(typescriptPrograms(page("```typescript\nconst a = 1\n```\n"))).toEqual(["const a = 1"])
	})

	test("a bash fence is never a program", () => {
		expect(typescriptPrograms(page("```bash\nbun add @trajectonomics/sim\n```\n"))).toEqual([])
	})

	test("an unclosed fence is not a program", () => {
		expect(typescriptPrograms(page("```ts\nconst a = 1\n"))).toEqual([])
	})

	test("two programs keep the order they appear in", () => {
		const content = "```ts\nconst first = 1\n```\n\n```ts\nconst second = 2\n```\n"
		expect(typescriptPrograms(page(content))).toEqual(["const first = 1", "const second = 2"])
	})
})
