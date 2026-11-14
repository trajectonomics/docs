import { readFileSync } from "node:fs"
import { stripJsoncComments } from "./adapters/jsonc"

/**
 * What one Wrangler config deploys (ADR 0005): the production Worker at the top level and the
 * staging Worker under `env.staging`. Staging inherits `assets` from the top level when it does not
 * set its own, as Wrangler does.
 */
export type WorkerConfig = {
	readonly productionName: string
	readonly productionAssetsDirectory: string
	readonly stagingName: string
	readonly stagingAssetsDirectory: string
	/** `env.staging.routes`; `undefined` when unset, which is not the same as an empty list. */
	readonly stagingRoutes: readonly string[] | undefined
	/** `env.staging.workers_dev`; `undefined` when staging does not set it itself. */
	readonly stagingWorkersDev: boolean | undefined
}

/** Read a Wrangler config from disk as a Workers Builds deploy reads it, comments and all. */
export function readWorkerConfig(configPath: string): WorkerConfig {
	return workerConfigOf(JSON.parse(stripJsoncComments(readFileSync(configPath, "utf8"))))
}

function workerConfigOf(parsed: unknown): WorkerConfig {
	const config = recordOf(parsed, "the Wrangler config")
	const assets = recordOf(config["assets"], "assets")
	const assetsDirectory = stringOf(assets["directory"], "assets.directory")
	const staging = recordOf(recordOf(config["env"], "env")["staging"], "env.staging")
	const stagingAssets =
		staging["assets"] === undefined
			? assetsDirectory
			: stringOf(
					recordOf(staging["assets"], "env.staging.assets")["directory"],
					"env.staging.assets.directory",
				)
	return Object.freeze({
		productionName: stringOf(config["name"], "name"),
		productionAssetsDirectory: assetsDirectory,
		stagingName: stringOf(staging["name"], "env.staging.name"),
		stagingAssetsDirectory: stagingAssets,
		stagingRoutes: routesOf(staging["routes"]),
		stagingWorkersDev: workersDevOf(staging["workers_dev"]),
	})
}

function recordOf(value: unknown, field: string): Record<string, unknown> {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		throw new Error(`${field} must be an object in the Wrangler config`)
	}
	return value as Record<string, unknown>
}

function stringOf(value: unknown, field: string): string {
	if (typeof value !== "string") {
		throw new Error(`${field} must be a string in the Wrangler config`)
	}
	return value
}

function routesOf(value: unknown): readonly string[] | undefined {
	if (value === undefined) {
		return undefined
	}
	if (!Array.isArray(value) || value.some((route) => typeof route !== "string")) {
		throw new Error("env.staging.routes must be a list of routes in the Wrangler config")
	}
	return Object.freeze([...value])
}

function workersDevOf(value: unknown): boolean | undefined {
	if (value === undefined) {
		return undefined
	}
	if (typeof value !== "boolean") {
		throw new Error("env.staging.workers_dev must be a boolean in the Wrangler config")
	}
	return value
}
