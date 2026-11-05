import { expect, test } from "@playwright/test";

const themes = ["schematic", "night", "light"] as const;

for (const theme of themes) {
	test(`visual: ${theme}, effects off`, async ({ page }) => {
		await page.goto(`/test/e2e/specimen.html?theme=${theme}&fx=off`);
		await page.evaluate(() => document.fonts.ready);
		await expect(page).toHaveScreenshot(`${theme}-fx-off.png`, {
			fullPage: true,
		});
	});

	test(`visual: ${theme}, effects on, reduced motion`, async ({ page }) => {
		await page.emulateMedia({ reducedMotion: "reduce" });
		await page.goto(`/test/e2e/specimen.html?theme=${theme}`);
		await page.evaluate(() => document.fonts.ready);
		await expect(page).toHaveScreenshot(`${theme}-fx-on-reduced.png`, {
			fullPage: true,
		});
	});
}
