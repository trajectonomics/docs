import { describe, expect, test } from "bun:test"
import { codeFences } from "./markdown-fences"

describe("the fenced code blocks a page publishes", () => {
	test("reads the language on an info string and the body between the fences", () => {
		expect(codeFences("# page\n\n```json\n{}\n```\n")).toEqual([{ language: "json", body: "{}\n" }])
	})

	test("takes the language alone from an info string carrying more", () => {
		expect(codeFences('```ts title="example"\nconst a = 1\n```\n')).toEqual([
			{ language: "ts", body: "const a = 1\n" },
		])
	})

	test("reports no fence for a block that is never closed", () => {
		expect(codeFences("```json\n{}\n")).toEqual([])
	})

	test("reads every fence of a page in source order", () => {
		expect(codeFences("```json\n{}\n```\n\ntext\n\n```ts\nconst a = 1\n```\n")).toEqual([
			{ language: "json", body: "{}\n" },
			{ language: "ts", body: "const a = 1\n" },
		])
	})
})
