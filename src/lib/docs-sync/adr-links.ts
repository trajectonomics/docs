/** Where an upstream release lives, so its ADRs can be linked at that exact tag. */
export interface UpstreamLocation {
	readonly repository: string
	readonly tag: string
}

const ADR_FILE = /[0-9A-Za-z._-]+\.md$/
const ADR_SEGMENT = /(?:^|\/)(?:docs\/)?adr\//
const MARKDOWN_LINK = /\[([^\]]+)\]\(([^)\s]+)\)/
const INLINE_CODE = /`([^`\n]+)`/g

/**
 * The canonical `docs/adr/<file>.md` path an upstream reference points at, or `null` when the
 * path is not an ADR. Relative prefixes (`./`, `../`, `/`) are dropped; a bare `adr/` is
 * anchored under `docs/`, because that is where Upstream Packages keep their ADRs.
 */
function adrPath(reference: string): string | null {
	const path = reference.split("#", 1)[0] ?? ""
	const segment = ADR_SEGMENT.exec(path)
	if (segment === null) {
		return null
	}
	const file = path.slice(segment.index + segment[0].length)
	return ADR_FILE.test(file) ? `docs/adr/${file}` : null
}

/** The absolute GitHub URL of an upstream ADR, at the released tag. */
function adrUrl(reference: string, location: UpstreamLocation): string | null {
	const path = adrPath(reference)
	if (path === null) {
		return null
	}
	const [, fragment] = reference.split("#", 2)
	const anchor = fragment === undefined ? "" : `#${fragment}`
	return `https://github.com/${location.repository}/blob/${location.tag}/${path}${anchor}`
}

function rewriteLink(match: string, location: UpstreamLocation): string {
	const parsed = MARKDOWN_LINK.exec(match)
	const label = parsed?.[1]
	const target = parsed?.[2]
	const url = target === undefined ? null : adrUrl(target, location)
	return label === undefined || url === null ? match : `[${label}](${url})`
}

/**
 * Point every upstream ADR reference at GitHub, at the released tag, so the Docs Portal links
 * upstream decisions instead of copying internal records into the site.
 */
export function rewriteUpstreamAdrLinks(markdown: string, location: UpstreamLocation): string {
	return markdown
		.split(INLINE_CODE)
		.map((part, index) => {
			if (index % 2 === 1) {
				const url = adrUrl(part, location)
				return url === null ? `\`${part}\`` : `[${part}](${url})`
			}
			return part.replace(/\[[^\]]+\]\([^)\s]+\)/g, (match) => rewriteLink(match, location))
		})
		.join("")
}
