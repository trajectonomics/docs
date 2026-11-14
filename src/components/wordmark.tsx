import wordmark from "@trajectonomics/design-system-assets/logo/wordmark.svg?raw"

/**
 * The design-system wordmark, inlined so its currentColor fill follows the
 * header text colour in both themes. The SVG carries role="img" and its own
 * accessible name.
 */
export function Wordmark() {
	return (
		<span
			className="inline-flex items-center [&_svg]:h-5 [&_svg]:w-auto"
			dangerouslySetInnerHTML={{ __html: wordmark }}
		/>
	)
}
