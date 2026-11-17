import type { Page } from "@playwright/test"
import { expect } from "./fixtures"

/** The storage key and value next-themes reads before the first script of a page runs. */
const STORAGE_KEY = "theme"
const STORED_LIGHT = "light"

/** Fumadocs' theme switch marks its control with this attribute; no page may render one. */
const THEME_TOGGLE = "[data-theme-toggle]"

/** What a reader's browser ends up with: the attribute the CSS keys on, the class Fumadocs keys on, and the rendering mode. */
export interface ThemeState {
	readonly theme: string | null
	readonly hasLightClass: boolean
	readonly colorScheme: string
}

/** Seed a stored `light` Theme before any of the page's own scripts run. */
export async function seedStoredLightTheme(page: Page): Promise<void> {
	await page.addInitScript(
		(seed: { key: string; value: string }) => {
			window.localStorage.setItem(seed.key, seed.value)
		},
		{ key: STORAGE_KEY, value: STORED_LIGHT },
	)
}

/** The Theme state the open page has reached. */
export async function themeState(page: Page): Promise<ThemeState> {
	return page.evaluate(() => {
		const root = document.documentElement
		return {
			theme: root.getAttribute("data-theme"),
			hasLightClass: root.classList.contains("light"),
			colorScheme: getComputedStyle(root).colorScheme,
		}
	})
}

/** Assert the open page renders the forced dark Theme and offers no control that switches it. */
export async function expectDarkTheme(page: Page): Promise<void> {
	const state = await themeState(page)
	expect(state.theme, "the Theme on <html>").toBe("dark")
	expect(state.hasLightClass, "the light class on <html>").toBe(false)
	expect(state.colorScheme, "the rendering mode").toBe("dark")
	await expect(page.locator(THEME_TOGGLE)).toHaveCount(0)
	await expect(page.getByRole("button", { name: /toggle theme/i })).toHaveCount(0)
}
