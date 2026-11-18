import { MarkdownTwinError } from "./markdown-twin"
import { PageWordsError } from "./page-words"

/**
 * A build step's result, with a frozen domain refusal rethrown as the build error Astro annotates in
 * place, so the terminal shows the refusal's own message instead of a TypeError.
 */
export async function buildStep<T>(step: () => Promise<T> | T): Promise<T> {
	try {
		return await step()
	} catch (error) {
		if (error instanceof MarkdownTwinError || error instanceof PageWordsError) {
			throw new Error(error.message)
		}
		throw error
	}
}
