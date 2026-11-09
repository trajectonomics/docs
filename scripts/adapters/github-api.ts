/** A GitHub REST call that needs no pagination and returns one JSON body. */
export interface GithubRequestInput {
	readonly method?: "GET" | "POST" | "PATCH"
	readonly path: string
	readonly body?: unknown
}

/** The response, as data: a failure is a value, so each adapter maps it to its own rule. */
export type GithubResponse =
	| { readonly ok: true; readonly body: unknown }
	| { readonly ok: false; readonly status: number; readonly text: string }

/** The GitHub REST client Docs Sync uses, authenticated with the workflow's token. */
export interface GithubApi {
	request(input: GithubRequestInput): Promise<GithubResponse>
}

/** A field of a JSON body that may not be an object at all. */
export function fieldOf(body: unknown, key: string): unknown {
	return typeof body === "object" && body !== null && key in body
		? (body as Record<string, unknown>)[key]
		: undefined
}

/** A string field of a JSON body, or `undefined` when the field is absent or another type. */
export function stringAt(body: unknown, key: string): string | undefined {
	const value = fieldOf(body, key)
	return typeof value === "string" ? value : undefined
}

/** The client, over `fetch`, at the API version this code was written against. */
export function createGithubApi(options: { readonly token: string }): GithubApi {
	const headers = {
		authorization: `Bearer ${options.token}`,
		accept: "application/vnd.github+json",
		"x-github-api-version": "2022-11-28",
		"content-type": "application/json",
	}
	return {
		async request(input: GithubRequestInput): Promise<GithubResponse> {
			const response = await fetch(`https://api.github.com${input.path}`, {
				method: input.method ?? "GET",
				headers,
				...(input.body === undefined ? {} : { body: JSON.stringify(input.body) }),
			})
			if (!response.ok) {
				return { ok: false, status: response.status, text: await response.text() }
			}
			const body: unknown = await response.json()
			return { ok: true, body }
		},
	}
}
