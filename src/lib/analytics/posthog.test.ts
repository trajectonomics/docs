import { describe, expect, it } from "bun:test"
import {
	capturePayload,
	MEASURED_HOSTNAME,
	PAGEVIEW_EVENT,
	POSTHOG_KEY,
	pageviewProperties,
	SESSION_STORAGE_KEY,
	type SessionStore,
	SURFACE,
	sessionId,
	shouldSend,
} from "./posthog"

/** A `sessionStorage` that answers from a record, so a test reads what the page wrote. */
function memoryStore(initial: Readonly<Record<string, string>> = {}): SessionStore & {
	readonly entries: Map<string, string>
} {
	const entries = new Map(Object.entries(initial))
	return {
		entries,
		getItem: (key) => entries.get(key) ?? null,
		setItem: (key, value) => {
			entries.set(key, value)
		},
	}
}

describe("shouldSend", () => {
	it("measures a reader on the production host who set no opt-out signal", () => {
		expect(
			shouldSend({ hostname: MEASURED_HOSTNAME, doNotTrack: null, globalPrivacyControl: null }),
		).toBe(true)
	})

	it("measures nobody on the `workers.dev` host or on `localhost`", () => {
		for (const hostname of ["localhost", "docs.workers.dev", ""]) {
			expect(shouldSend({ hostname, doNotTrack: null, globalPrivacyControl: null })).toBe(false)
		}
	})

	it("measures nobody who asked not to be tracked", () => {
		expect(
			shouldSend({ hostname: MEASURED_HOSTNAME, doNotTrack: "1", globalPrivacyControl: null }),
		).toBe(false)
		expect(
			shouldSend({ hostname: MEASURED_HOSTNAME, doNotTrack: null, globalPrivacyControl: true }),
		).toBe(false)
	})
})

describe("pageviewProperties", () => {
	const properties = pageviewProperties({
		href: "https://trajectonomics.com/docs/cli/installation/",
		referrer: "https://trajectonomics.com/en/",
		language: "en",
		title: "CLI installation — Trajectonomics Docs",
	})

	it("names the page by its URL, host and path, which the Web Analytics product reads", () => {
		expect(properties["$current_url"]).toBe("https://trajectonomics.com/docs/cli/installation/")
		expect(properties["$host"]).toBe("trajectonomics.com")
		expect(properties["$pathname"]).toBe("/docs/cli/installation/")
	})

	it("carries how the reader arrived, the page's title and its Language", () => {
		expect(properties["$referrer"]).toBe("https://trajectonomics.com/en/")
		expect(properties["$title"]).toBe("CLI installation — Trajectonomics Docs")
		expect(properties["language"]).toBe("en")
	})

	it("says which Surface sent it", () => {
		expect(properties["surface"]).toBe(SURFACE)
	})
})

describe("capturePayload", () => {
	const payload = capturePayload(PAGEVIEW_EVENT, "session-1", { language: "en" })

	it("posts the project key, the event and the properties the endpoint reads", () => {
		expect(payload.event).toBe("$pageview")
		expect(payload.api_key).toBe(POSTHOG_KEY)
		expect(payload.api_key.startsWith("phc_")).toBe(true)
	})

	it("carries the distinct id among the properties, and keeps no person", () => {
		expect(payload.properties["distinct_id"]).toBe("session-1")
		expect(payload.properties["$process_person_profile"]).toBe(false)
	})

	it("keeps the properties the caller passed", () => {
		expect(payload.properties["language"]).toBe("en")
	})
})

describe("sessionId", () => {
	it("creates an id for a tab that has none and keeps it for the tab's next pageview", () => {
		const store = memoryStore()
		expect(sessionId(store, () => "new-id")).toBe("new-id")
		expect(sessionId(store, () => "another-id")).toBe("new-id")
		expect(store.entries.get(SESSION_STORAGE_KEY)).toBe("new-id")
	})

	it("reuses the id the tab already carries", () => {
		expect(sessionId(memoryStore({ [SESSION_STORAGE_KEY]: "kept" }), () => "ignored")).toBe("kept")
	})
})
