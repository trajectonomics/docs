import { describe, expect, test } from "bun:test"
import type { ContentFile } from "./content-pages"
import { codeFences, typescriptPrograms } from "./content-programs"

function page(block: string): ContentFile {
	return { path: "developers/sim-core/index.mdx", content: block }
}

describe("the fenced code blocks a Docs Portal page publishes", () => {
	test("a block reports the language on its info string and the text between its fences", () => {
		expect(codeFences("# page\n\n```json\n{}\n```\n")).toEqual([{ language: "json", body: "{}" }])
	})

	test("the language is read without the options that follow it", () => {
		expect(codeFences('```ts title="example"\nconst a = 1\n```\n')).toEqual([
			{ language: "ts", body: "const a = 1" },
		])
	})

	test("every block of a page is reported in source order", () => {
		const content = "```json\n{}\n```\n\ntext\n\n```ts\nconst a = 1\n```\n"
		expect(codeFences(content).map((fence) => fence.language)).toEqual(["json", "ts"])
	})
})

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
