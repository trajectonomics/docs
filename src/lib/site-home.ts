/**
 * The way back to the Site Home, the page at `/` that `trajectonomics/site` deploys: its words and
 * how the link loads. Pure, so a browser test asserts the link without loading the React shell.
 */

/** Visible text of the link to the Site Home. */
export const SITE_HOME_LABEL = "trajectonomics.com"

/**
 * URL path of the Site Home. Relative, so the href is right on the apex and on the staging
 * `workers.dev` host (ADR 0006, ADR 0005).
 */
export const SITE_HOME_PATH = "/"

/**
 * Attributes that make the Site Home a full document load: `/` is not a page the Docs Portal
 * serves, so it must not be prefetched by the Client Router on hover (ADR 0006).
 */
export const SITE_HOME_LOAD = {
	"data-astro-reload": true,
	"data-astro-prefetch": "false",
} as const
