import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const themes = ["schematic", "night", "light"] as const;
const motions = ["reduce", "no-preference"] as const;

for (const theme of themes) {
	for (const reducedMotion of motions) {
		test(`axe: no violations (${theme}, ${reducedMotion})`, async ({
			page,
		}) => {
			await page.emulateMedia({ reducedMotion });
			await page.goto(`/test/e2e/specimen.html?theme=${theme}`);
			await page.evaluate(() => document.fonts.ready);
			const results = await new AxeBuilder({ page })
				.withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
				.analyze();
			expect(results.violations).toEqual([]);
		});
	}
}
