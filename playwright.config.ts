import { defineConfig, devices } from "@playwright/test"

const PORT = 8787
const BASE_URL = `http://127.0.0.1:${PORT}`

/**
 * Browser tests for the built Docs Portal, served by the Worker (`wrangler dev`) so the
 * redirect, trailing-slash and 404 rules are the production ones (ADR 0004).
 */
export default defineConfig({
	testDir: "e2e",
	testMatch: "**/*.e2e.ts",
	fullyParallel: true,
	retries: 0,
	reporter: process.env["CI"] ? [["list"], ["html", { open: "never" }]] : "list",
	use: {
		baseURL: BASE_URL,
		trace: "retain-on-failure",
	},
	projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
	webServer: {
		command: `bunx wrangler dev --ip 127.0.0.1 --port ${PORT}`,
		url: `${BASE_URL}/docs/cli/`,
		reuseExistingServer: false,
		timeout: 120_000,
	},
})
