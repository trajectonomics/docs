import { describe, expect, test } from "bun:test"
import { join } from "node:path"
import { readWorkerConfig } from "./worker-config"

// The config at the repository root is what Workers Builds reads on every deploy (ADR 0005).
const config = readWorkerConfig(join(import.meta.dir, "..", "wrangler.jsonc"))

describe("the Worker config for staging and production", () => {
	test("production deploys the Worker named docs", () => {
		expect(config.productionName).toBe("docs")
	})

	test("staging deploys its own Worker named docs-staging", () => {
		expect(config.stagingName).toBe("docs-staging")
	})

	test("both environments serve the same built assets", () => {
		expect(config.stagingAssetsDirectory).toBe(config.productionAssetsDirectory)
		expect(config.productionAssetsDirectory).toBe("./dist")
	})

	test("staging has an explicit empty route list, so the public route can only attach to production", () => {
		expect(config.stagingRoutes).toEqual([])
	})

	test("staging is served on its workers.dev URL", () => {
		expect(config.stagingWorkersDev).toBe(true)
	})
})
