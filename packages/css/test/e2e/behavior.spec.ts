import { expect, test } from "@playwright/test";

const url = (theme = "night") => `/test/e2e/specimen.html?theme=${theme}`;

test("scan panel: focus ring is visible and the overlay does not intercept the link", async ({
	page,
}) => {
	await page.goto(url("night"));
	const link = page.locator("#scan-link");
	for (let i = 0; i < 20; i++) {
		if (await link.evaluate((el) => el === document.activeElement)) break;
		await page.keyboard.press("Tab");
	}
	await expect(link).toBeFocused();
	const { outline, expected } = await link.evaluate((el) => {
		const probe = document.createElement("i");
		probe.style.color = "var(--fs-focus-ring)";
		document.body.append(probe);
		const expected = getComputedStyle(probe).color;
		probe.remove();
		const cs = getComputedStyle(el);
		return {
			outline: {
				style: cs.outlineStyle,
				width: cs.outlineWidth,
				color: cs.outlineColor,
			},
			expected,
		};
	});
	expect(outline.style).toBe("solid");
	expect(outline.width).toBe("2px");
	expect(outline.color).toBe(expected);
	const hit = await link.evaluate((el) => {
		el.scrollIntoView({ block: "center", behavior: "instant" });
		const r = el.getBoundingClientRect();
		return (
			document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2) === el
		);
	});
	expect(hit).toBe(true);
});

test("reduced motion: no animation on effects, bleed shadow stays", async ({
	page,
}) => {
	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto(url("night"));
	const names = await page.evaluate(() => {
		const out: string[] = [];
		for (const el of document.querySelectorAll("[data-fs-fx], .fs-cursor")) {
			for (const pseudo of [null, "::before", "::after"]) {
				out.push(getComputedStyle(el, pseudo).animationName);
			}
		}
		return out;
	});
	expect(names.length).toBeGreaterThan(0);
	expect(names.every((n) => n === "none")).toBe(true);
	const shadow = await page
		.locator("#bleed-title")
		.evaluate((el) => getComputedStyle(el).textShadow);
	expect(shadow).not.toBe("none");
});

test('data-fs-motion="paused" pauses cursor and sweep', async ({ page }) => {
	await page.goto(url("night"));
	await page.evaluate(() =>
		document.documentElement.setAttribute("data-fs-motion", "paused"),
	);
	const states = await page.evaluate(() => ({
		cursor: getComputedStyle(document.querySelector(".fs-cursor") as Element)
			.animationPlayState,
		sweep: getComputedStyle(
			document.querySelector("#scan-panel") as Element,
			"::before",
		).animationPlayState,
	}));
	expect(states).toEqual({ cursor: "paused", sweep: "paused" });
});

test("prefers-contrast: more strengthens lines and removes decoration", async ({
	page,
}) => {
	await page.emulateMedia({ contrast: "more" });
	await page.goto(url("night"));
	const r = await page.evaluate(() => {
		const c = (id: string) =>
			getComputedStyle(document.querySelector(id) as Element);
		return {
			nestedBox: c("#nested-box").borderTopColor,
			nestedStrong: c("#nested-strong").borderTopColor,
			pageLine: c("#page-line").borderTopColor,
			pageStrong: c("#page-strong").borderTopColor,
			scan: getComputedStyle(
				document.querySelector("#scan-panel") as Element,
				"::after",
			).display,
			bleedShadow: c("#bleed-title").textShadow,
			bleedAnim: c("#bleed-title").animationName,
		};
	});
	expect(r.nestedBox).toBe(r.nestedStrong);
	expect(r.pageLine).toBe(r.pageStrong);
	expect(r.scan).toBe("none");
	expect(r.bleedShadow).toBe("none");
	expect(r.bleedAnim).toBe("none");
});

test("forced-colors: decoration hidden, cursor stays visible", async ({
	page,
}) => {
	await page.emulateMedia({ forcedColors: "active" });
	await page.goto(url("night"));
	const r = await page.evaluate(() => ({
		scan: getComputedStyle(
			document.querySelector("#scan-panel") as Element,
			"::after",
		).display,
		shadow: getComputedStyle(document.querySelector("#bleed-title") as Element)
			.textShadow,
		cursorBg: getComputedStyle(document.querySelector(".fs-cursor") as Element)
			.backgroundColor,
	}));
	expect(r.scan).toBe("none");
	expect(r.shadow).toBe("none");
	expect(r.cursorBg).not.toBe("rgba(0, 0, 0, 0)");
	expect(r.cursorBg).not.toBe("transparent");
});
