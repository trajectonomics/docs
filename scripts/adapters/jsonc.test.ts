import { describe, expect, test } from "bun:test"
import { stripJsoncComments } from "./jsonc"

describe("reading a JSONC config", () => {
	test("line and block comments are removed and the rest parses", () => {
		const text = `{
			// a comment
			"name": "docs", /* an inline comment */
			"workers_dev": true
		}`

		expect(JSON.parse(stripJsoncComments(text))).toEqual({ name: "docs", workers_dev: true })
	})

	test("a comment marker inside a string is part of the string, not a comment", () => {
		const text = '{ "url": "https://example.com/docs", "note": "a /* kept */ string" }'

		expect(JSON.parse(stripJsoncComments(text))).toEqual({
			url: "https://example.com/docs",
			note: "a /* kept */ string",
		})
	})
})
