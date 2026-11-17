/**
 * The pageview the Docs Portal posts to PostHog, and the conditions under which it posts none.
 *
 * The Portal loads no third-party script, so it posts to PostHog's capture endpoint itself
 * ([ADR 0008](../../../docs/adr/0008-analytics-from-the-page-itself.md)). A project key can only
 * write events, so it is public by design and is committed here.
 */

/** The PostHog project's ingestion key: write-only, and the same key the Site uses. */
export const POSTHOG_KEY = "phc_o5LAcajRLpXxdxbUKg4f4veqqdM9xwQ954aQ92vCNvsF"

/** The capture endpoint of the project's EU host, the region the project lives in. */
export const POSTHOG_CAPTURE_URL = "https://eu.i.posthog.com/i/v0/e/"

/** The only host whose pages are measured: a `workers.dev` or `localhost` page would pollute the project. */
export const MEASURED_HOSTNAME = "trajectonomics.com"

/** The name this Surface writes into every event, so one project can tell the surfaces apart. */
export const SURFACE = "docs"

/** The event one page load sends, and the name PostHog's Web Analytics reads. */
export const PAGEVIEW_EVENT = "$pageview"

/** The key the tab-scoped Session id lives under. `sessionStorage` is not a cookie, and it dies with the tab. */
export const SESSION_STORAGE_KEY = "traj-docs-session"

/** The Astro event the Client Router fires on the first page and after every client-side navigation. */
export const PAGE_LOAD_EVENT = "astro:page-load"

/** The browser conditions that decide whether the page measures a reader at all. */
export interface VisitorConditions {
	readonly hostname: string
	/** `navigator.doNotTrack`: `"1"` when the reader asked every site not to track them. */
	readonly doNotTrack: string | null
	/** `navigator.globalPrivacyControl`: `true` when the reader asked every site not to sell or share. */
	readonly globalPrivacyControl: boolean | null
}

/** One page the pageview describes, as the document gives it. */
export interface PageviewSource {
	readonly href: string
	readonly referrer: string
	/** The `lang` of the document, which the Portal publishes as `en`. */
	readonly language: string
	readonly title: string
}

/** The distinct id one pageview carries, so a visit's pageviews stay together without a cookie. */
export interface SessionStore {
	getItem(key: string): string | null
	setItem(key: string, value: string): void
}

/** The body one event posts: the endpoint reads `api_key` and `event` beside the properties. */
export interface CapturePayload {
	readonly api_key: string
	readonly event: string
	readonly properties: Readonly<Record<string, string | number | boolean>>
}

/**
 * Whether the page measures this reader: the production host, and neither opt-out signal set.
 *
 * A reader on the `workers.dev` staging host or on `localhost` is not measured, so a preview never
 * reaches the project, and the check needs no build flag, which the served page could not read.
 */
export function shouldSend(conditions: VisitorConditions): boolean {
	if (conditions.hostname !== MEASURED_HOSTNAME) return false
	if (conditions.doNotTrack === "1") return false
	return conditions.globalPrivacyControl !== true
}

/** The properties of one pageview: where the reader is, how they arrived, and which page it is. */
export function pageviewProperties(
	source: PageviewSource,
): Readonly<Record<string, string | boolean>> {
	const url = new URL(source.href)
	return {
		$current_url: source.href,
		$host: url.host,
		$pathname: url.pathname,
		$referrer: source.referrer,
		$title: source.title,
		language: source.language,
		surface: SURFACE,
	}
}

/**
 * The body one event posts. `$process_person_profile` is `false`: the Portal keeps no person, so a
 * reader is a pageview count and never a profile with a history.
 */
export function capturePayload(
	event: string,
	distinctId: string,
	properties: Readonly<Record<string, string | boolean>>,
): CapturePayload {
	return {
		api_key: POSTHOG_KEY,
		event,
		properties: { ...properties, distinct_id: distinctId, $process_person_profile: false },
	}
}

/**
 * The tab's distinct id, created on the first pageview and reused for the tab's later pageviews, so
 * one visit is one id and two visits are never the same one.
 */
export function sessionId(store: SessionStore, createId: () => string): string {
	const stored = store.getItem(SESSION_STORAGE_KEY)
	if (stored !== null && stored.length > 0) return stored
	const created = createId()
	store.setItem(SESSION_STORAGE_KEY, created)
	return created
}
