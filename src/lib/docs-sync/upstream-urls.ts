import type { UpstreamPackageName } from "./types"

/** The GitHub organization every Upstream Package belongs to. */
export const UPSTREAM_ORG = "trajectonomics"

/** `owner/name` of an Upstream Package, canonical even when a dispatch names it bare. */
export function upstreamRepository(upstreamPackage: UpstreamPackageName): string {
	return `${UPSTREAM_ORG}/${upstreamPackage}`
}

/** The GitHub release page of the tag the proposal was synced from. */
export function upstreamReleaseUrl(upstreamPackage: UpstreamPackageName, tag: string): string {
	return `https://github.com/${upstreamRepository(upstreamPackage)}/releases/tag/${tag}`
}

/** The upstream changes between two released tags. */
export function upstreamCompareUrl(
	upstreamPackage: UpstreamPackageName,
	fromTag: string,
	toTag: string,
): string {
	return `https://github.com/${upstreamRepository(upstreamPackage)}/compare/${fromTag}...${toTag}`
}
