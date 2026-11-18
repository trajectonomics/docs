import { describe, expect, test } from "bun:test"
import { buildLandingTwin } from "./landing-twin"

const ORIGIN = "https://trajectonomics.com"

describe("the Landing Page's Markdown twin", () => {
	test("states the Portal's name, purpose and release line, then one entry per Tab's Markdown", () => {
		expect(buildLandingTwin("Docs synced from traj v0.2.0", ORIGIN)).toBe(
			[
				"# Trajectonomics Docs",
				"",
				"> Documentation for running the Trajectonomics CLI and building on its packages.",
				"",
				"Docs synced from traj v0.2.0",
				"",
				"## For Operators: install and run the CLI",
				"",
				"- [CLI & Quickstart](https://trajectonomics.com/docs/cli.md): Install traj, then record your first transaction and read your balance.",
				"",
				"## For Builders: build on Trajectonomics packages",
				"",
				"- [Build on Trajectonomics](https://trajectonomics.com/docs/developers.md): What each package computes, and how to adopt one without the others.",
				"",
			].join("\n"),
		)
	})

	test("states the release line it is given, so the twin cannot name another release", () => {
		expect(buildLandingTwin("Docs synced from traj v0.3.0-rc.1", ORIGIN)).toContain(
			"Docs synced from traj v0.3.0-rc.1",
		)
	})
})
