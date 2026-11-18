import { describe, expect, test } from "bun:test"
import { resolve } from "node:path"
import { CONTENT_ROOT } from "./content-pages"
import { typescriptPrograms } from "./content-programs"
import { manifestEntry, parseSyncManifest, SYNC_MANIFEST_PATH } from "./docs-sync/manifest"

/** The Builder page whose TypeScript programs must run as printed. */
const PAGE = "developers/sim-core/index.mdx"

/** The repository root, where the installed package the program imports is resolved from. */
const REPO_ROOT = resolve(import.meta.dir, "../..")

/** How long one program may run before the check fails it, so a hung run cannot hold a Claim. */
const RUN_TIMEOUT_MS = 30_000

/** The fence this page shipped before the Spec: `baseline` and `scenario` are defined nowhere. */
const UNDEFINED_INPUTS = `import { project } from "@trajectonomics/sim"

const result = project(baseline, scenario, {
  start: "2026-01-01",
  horizon: "2056-01-01",
  resolution: "month",
})

if (!result.ok) {
  console.error(result.problems)
} else {
  console.log(result.projection.rows)
}
`

/** A Scenario the engine rejects: the surplus step names an Account it never declares. */
const INVALID_SCENARIO = `import { project } from "@trajectonomics/sim"

const result = project(
  { schemaVersion: 1, balances: [] },
  {
    schemaVersion: 1,
    currency: "THB",
    economy: { inflation: 0 },
    accounts: [{ id: "cash", kind: "asset", rate: 0 }],
    flows: [],
    cashflow: { surplus: [{ account: "savings" }], withdraw: ["cash"] },
  },
  { start: "2026-01-01", horizon: "2027-01-01", resolution: "month" },
)

if (!result.ok) {
  console.error(result.problems)
}
`

/** A green run: exit 0 with nothing on stderr, because `project()` reports problems there. */
interface Run {
	readonly code: number
	readonly stderr: string
}

function run(source: string): Run {
	const result = Bun.spawnSync([process.execPath, "--no-install", "-e", source], {
		cwd: REPO_ROOT,
		timeout: RUN_TIMEOUT_MS,
	})
	return { code: result.exitCode, stderr: result.stderr.toString() }
}

const page = await Bun.file(`${REPO_ROOT}/${CONTENT_ROOT}/${PAGE}`).text()
const programs = typescriptPrograms({ path: PAGE, content: page })

function firstLine(program: string): string {
	const [line = ""] = program.split("\n")
	return line
}

describe("the sim-core example runs as printed", () => {
	test(`${PAGE} publishes at least one TypeScript program`, () => {
		expect(programs.length).toBeGreaterThan(0)
	})

	for (const program of programs) {
		test(`${PAGE}, program starting "${firstLine(program)}" runs green`, () => {
			expect(run(program)).toEqual({ code: 0, stderr: "" })
		})
	}

	test("a program with an undefined input is not green", () => {
		expect(run(UNDEFINED_INPUTS).code).not.toBe(0)
	})

	test("a Scenario the engine rejects is not green", () => {
		expect(run(INVALID_SCENARIO).stderr).not.toBe("")
	})
})

describe("the example runs against the release the page documents", () => {
	test("the sim devDependency equals the sync manifest's sim-core tag", async () => {
		const manifest = parseSyncManifest(await Bun.file(`${REPO_ROOT}/${SYNC_MANIFEST_PATH}`).text())
		const tag = manifestEntry(manifest, "sim-core")?.lastSyncedTag
		const packageJson = JSON.parse(await Bun.file(`${REPO_ROOT}/package.json`).text()) as {
			readonly devDependencies?: Readonly<Record<string, string>>
		}
		expect(tag).toBeDefined()
		expect(packageJson.devDependencies?.["@trajectonomics/sim"]).toBe(tag?.replace(/^v/, ""))
	})
})
