/**
 * A build step's result, with a frozen error carried as its `cause`: Astro annotates a thrown error
 * in place, which a frozen error refuses, and the message still reaches the terminal.
 */
export async function runBuildStep<T>(step: () => Promise<T> | T): Promise<T> {
	try {
		return await step()
	} catch (error) {
		if (error instanceof Error && Object.isFrozen(error)) {
			throw new Error(error.message, { cause: error })
		}
		throw error
	}
}
