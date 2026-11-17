/*
 * Astro's MDX pipeline hands a fence to the highlighter as a `<pre>` wrapping the restored code
 * block, whose `language-*` class sits on the inner element and whose text is a bare text node.
 * The Fumadocs integration renames the block to `fumadocs-pre` so Astro's own highlighter skips
 * it, then restores it without the `<code>` child its `rehypeCode` reads. Flatten the wrapper and
 * put the `<code>` element back, so `rehypeCode` can colour the block before it renders.
 */

interface HastNode {
	readonly type: string
	readonly tagName?: string
	readonly properties?: Record<string, unknown>
	readonly children?: HastNode[]
}

interface HastVisitorContext {
	replaceNode(node: HastNode, newNode: HastNode | readonly HastNode[]): void
}

interface HastPlugin {
	readonly name: string
	readonly element: {
		readonly filter: string[]
		visit(node: HastNode, context: HastVisitorContext): void
	}
}

const LANGUAGE_CLASS_PREFIX = "language-"

function languageClass(node: HastNode): string | undefined {
	const classes = node.properties?.["className"]
	return Array.isArray(classes)
		? classes.find(
				(value): value is string =>
					typeof value === "string" && value.startsWith(LANGUAGE_CLASS_PREFIX),
			)
		: undefined
}

/** Restores the `<code>` child of an Astro MDX fence, unwrapping the `<pre>` around it. */
export function restoreCodeFences(): HastPlugin {
	return {
		name: "docs-restore-code-fences",
		element: {
			filter: ["pre"],
			visit(node, context) {
				const [only] = node.children ?? []
				if ((node.children ?? []).length !== 1 || only?.tagName !== "pre") return
				const className = languageClass(only)
				if (className === undefined) return
				context.replaceNode(only, {
					type: "element",
					tagName: "code",
					properties: { className: [className] },
					children: only.children ?? [],
				})
			},
		},
	}
}
