---
status: accepted
---

# The Docs Portal measures pageviews from the page itself

The Docs Portal reported nothing about its readers. The organisation's `docs` Surface can say whether a page exists and whether its links resolve, and nothing about which pages are read, how a reader arrived, or which Language they came from. The owner asked for PostHog analytics on the Site and the Docs Portal on 2026-11-17; the Site's half is [site ADR 0011](https://github.com/trajectonomics/site/blob/main/docs/adr/0011-analytics-from-the-page-itself.md), and the two share one project and one ingestion key.

The Portal is a static build served under `/docs` by a Worker, and it navigates with Astro's Client Router, which swaps the page without loading a document. That decides the shape of the measurement: a pageview script that runs once on load would count one page per visit and miss every navigation after it.

## Decision

1. **PostHog is the Portal's analytics service.** The project is `268299` on the EU host, the same project the Site writes to. Its ingestion key is public by design — it can only write events — so it is committed in `src/lib/analytics/posthog.ts`.
2. **The page posts the event itself.** It sends a JSON body to `https://eu.i.posthog.com/i/v0/e/` with `navigator.sendBeacon` and a `text/plain` body, falling back to `fetch` with `keepalive`. No library and no third-party script: the Portal loads nothing it does not build.
3. **One pageview per page the reader opens.** `$pageview` is sent on the first page and again on every `astro:page-load` the Client Router fires after a navigation. The address of the last measured page is the guard, so the first page is counted once and a reader who presses back is counted again.
4. **A tab-scoped id, in `sessionStorage`.** One visit's pageviews share a `distinct_id`, and two visits never do. `sessionStorage` is not a cookie, it dies with the tab, and the Portal sets no cookie. `$process_person_profile` is `false` on every event, so PostHog keeps no person: the id groups a visit, it does not identify a reader.
5. **Only the production host is measured.** The page sends nothing unless `location.hostname` is `trajectonomics.com`, which keeps `workers.dev` and `localhost` out of the project without a build flag the served page could not read.
6. **An opt-out wins.** A reader whose browser reports `navigator.doNotTrack === "1"` or `navigator.globalPrivacyControl === true` is not measured at all.
7. **The payloads are pure functions with tests.** `pageviewProperties`, `capturePayload` and `shouldSend` live in `src/lib/analytics/` beside their unit tests; only `client.ts` touches the browser.

## Considered Options

- **`posthog-js`.** It brings autocapture, session replay, heatmaps and funnels for free. Rejected: it is a third-party script of 40 KB or more loaded from another origin, which the Portal's build has so far never done, and this measurement needs one event.
- **A pageview in the Worker from request logs.** Rejected: Workers Static Assets logs say a file was fetched, not which document a reader opened, and a client-side navigation fetches none.
- **A pageview only on the document load.** Rejected: with the Client Router, every navigation after the first page would be invisible, which is most of a documentation read.
- **No analytics.** Rejected by the owner's request; the Portal would keep no evidence of which pages readers use.

## Consequences

- Which pages are read, from where, and in which Language becomes a number, and a client-side navigation counts like a page load.
- The Portal now writes to a third party on the reader's behalf. It sends no cookie, no id that survives the tab, and no content of the page; it sends the address, the referrer, the title and the `lang`.
- A reader with JavaScript off is not measured at all. That is an absence of evidence, not zero readers.
- Reading the numbers needs a PostHog credential, which only the owner holds. A Factory pass reads them through the PostHog MCP server, not through this repository.
