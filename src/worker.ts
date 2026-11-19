import { type AssetsBinding, handleRequest } from "./lib/worker/handler"

/** The bindings `wrangler.jsonc` gives the Portal's Worker. */
interface Env {
	readonly ASSETS: AssetsBinding
}

// The assets Worker gains an entry module only to answer `Accept: text/markdown` (ADR 0010);
// `run_worker_first` in wrangler.jsonc sends it every path under /docs, and it forwards the rest.
export default {
	fetch(request: Request, env: Env): Promise<Response> {
		return handleRequest(request, env.ASSETS)
	},
}
