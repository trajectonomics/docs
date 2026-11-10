import AxeBuilder from "@axe-core/playwright"
import { openPage, pageName, pagesUnderTest } from "./built-site"
import { expect, test } from "./fixtures"

for (const path of pagesUnderTest()) {
	test(`the ${pageName(path)} page has no serious accessibility violations`, async ({ page }) => {
		await openPage(page, path)

		const results = await new AxeBuilder({ page }).analyze()
		const blocking = results.violations.filter(
			(violation) => violation.impact === "serious" || violation.impact === "critical",
		)

		expect(
			blocking.map((violation) => `${violation.id}: ${violation.help}`),
			`${path} passes axe for serious and critical rules`,
		).toEqual([])
	})
}
