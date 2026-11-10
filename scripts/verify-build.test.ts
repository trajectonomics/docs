import { describe, expect, test } from "bun:test"
import { randomUUID } from "node:crypto"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { main } from "./verify-build"

describe("the verify-build script", () => {
	test("a build root that does not exist fails with the message saying to build first", async () => {
		const errors: string[] = []
		const report = console.error
		console.error = (...message: unknown[]) => {
			errors.push(message.join(" "))
		}
		try {
			expect(await main(join(tmpdir(), `missing-build-${randomUUID()}`))).toBe(1)
		} finally {
			console.error = report
		}

		expect(errors.join("\n")).toContain("Run `bun run build` first")
	})
})
