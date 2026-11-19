/** The values that appear more than once, in the order they first appear. */
export function duplicates<T>(values: readonly T[]): readonly T[] {
	const counts = new Map<T, number>()
	for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
	return [...counts].filter(([, count]) => count > 1).map(([value]) => value)
}
