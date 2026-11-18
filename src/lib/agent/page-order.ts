import type { Node, Root } from "fumadocs-core/page-tree"

/** The page URLs a sidebar node presents: a folder's index page first, then its children in order. */
function nodeUrls(node: Node): readonly string[] {
	if (node.type === "page") {
		return node.external === true ? [] : [node.url]
	}
	if (node.type === "folder") {
		const index = node.index === undefined ? [] : [node.index.url]
		return [...index, ...node.children.flatMap(nodeUrls)]
	}
	return []
}

/** Every page URL the Docs sidebar presents, in the order the Tabs and their folders present them. */
export function sidebarPageUrls(tree: Root): readonly string[] {
	return Object.freeze(tree.children.flatMap(nodeUrls))
}
