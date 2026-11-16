import { describe, expect, test } from "bun:test"
import { restoreCodeFences } from "./code-fences"

type Node = Parameters<ReturnType<typeof restoreCodeFences>["element"]["visit"]>[0]

const plugin = restoreCodeFences()

/** Run the plugin over one node, returning the replacement it made, if any. */
function run(node: Node): { node: Node; replacement: Node } | undefined {
	let made: { node: Node; replacement: Node } | undefined
	plugin.element.visit(node, {
		replaceNode(target, replacement) {
			made = { node: target, replacement: replacement as Node }
		},
	})
	return made
}

const TEXT = { type: "text" }

/** The shape Astro's MDX pipeline hands a `bash` fence to the highlighter. */
const ASTRO_FENCE: Node = {
	type: "element",
	tagName: "pre",
	children: [
		{
			type: "element",
			tagName: "pre",
			properties: { className: ["language-bash"] },
			children: [TEXT],
		},
	],
}

describe("restoreCodeFences", () => {
	test("an Astro MDX fence regains the code child its highlighter reads", () => {
		const made = run(ASTRO_FENCE)

		expect(made?.node.tagName).toBe("pre")
		expect(made?.replacement).toEqual({
			type: "element",
			tagName: "code",
			properties: { className: ["language-bash"] },
			children: [TEXT],
		})
	})

	test("a fence that already has a code child is left alone", () => {
		const classic: Node = {
			type: "element",
			tagName: "pre",
			children: [{ type: "element", tagName: "code", properties: { className: ["bash"] } }],
		}

		expect(run(classic)).toBeUndefined()
	})

	test("a pre without a language class is left alone", () => {
		const plain: Node = {
			type: "element",
			tagName: "pre",
			children: [{ type: "element", tagName: "pre", children: [TEXT] }],
		}

		expect(run(plain)).toBeUndefined()
	})
})
