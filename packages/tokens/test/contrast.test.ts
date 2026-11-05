import { describe, expect, it } from "vitest";
import { CONTRAST_RULES, type Role, wcagRatio } from "../scripts/contrast.mjs";
import {
	type ColorValue,
	flatten,
	readTokens,
	resolve,
	THEMES,
} from "../scripts/load.mjs";

const resolved = resolve(flatten(await readTokens()));

function color(theme: string, role: Role): ColorValue {
	const token = resolved.get(`theme.${theme}.color.${role}`);
	if (!token) throw new Error(`missing token theme.${theme}.color.${role}`);
	return token.$value as ColorValue;
}

describe("wcagRatio sanity", () => {
	const hex = (h: string) => ({
		colorSpace: "oklch" as const,
		components: [0, 0, 0] as [number, number, number],
		hex: h,
	});
	it("black on white is 21", () => {
		expect(wcagRatio(hex("#000000"), hex("#FFFFFF"))).toBeCloseTo(21, 2);
	});
	it("#DCE8F7 on #050608 is 16.34", () => {
		expect(
			Math.abs(wcagRatio(hex("#DCE8F7"), hex("#050608")) - 16.34),
		).toBeLessThan(0.05);
	});
});

describe("CONTRAST_RULES coverage", () => {
	it("covers exactly the promised pairs", () => {
		const surfaces = ["bg", "surface", "surface-raised"];
		const expected = [
			...[
				"text",
				"text-strong",
				"text-muted",
				"text-subtle",
				"link",
				"link-hover",
				"info",
				"success",
				"warning",
				"danger",
				"accent",
			].map((fg) => ({ fg, bg: [...surfaces].sort(), min: 4.5 })),
			{ fg: "on-accent", bg: ["accent"], min: 4.5 },
			{ fg: "on-danger", bg: ["danger"], min: 4.5 },
			{ fg: "line-strong", bg: [...surfaces].sort(), min: 3 },
			{ fg: "focus-ring", bg: [...surfaces].sort(), min: 3 },
		];
		const norm = (r: { fg: string; bg: string[]; min: number }) => ({
			fg: r.fg,
			bg: [...r.bg].sort(),
			min: r.min,
		});
		const byFg = (a: { fg: string }, b: { fg: string }) =>
			a.fg.localeCompare(b.fg);
		expect(CONTRAST_RULES.map(norm).sort(byFg)).toEqual(expected.sort(byFg));
	});
});

describe("semantic pairs meet WCAG", () => {
	for (const theme of THEMES) {
		for (const rule of CONTRAST_RULES) {
			let backgrounds = rule.bg;
			// DESIGN.md: night line-strong is 3,4 on the worst background; check that one only.
			if (theme === "night" && rule.fg === "line-strong") {
				const worst = [...rule.bg].sort(
					(a, b) =>
						wcagRatio(color(theme, rule.fg), color(theme, a)) -
						wcagRatio(color(theme, rule.fg), color(theme, b)),
				)[0] as Role;
				backgrounds = [worst];
			}
			for (const bg of backgrounds) {
				it(`${theme}: ${rule.fg} on ${bg} >= ${rule.min}`, () => {
					const ratio = wcagRatio(color(theme, rule.fg), color(theme, bg));
					expect(
						ratio,
						`${theme}: ${rule.fg} on ${bg} = ${ratio.toFixed(2)} (min ${rule.min})`,
					).toBeGreaterThanOrEqual(rule.min);
				});
			}
		}
	}
});

describe("line stays decorative", () => {
	for (const theme of THEMES) {
		it(`${theme}: line on bg < 3`, () => {
			const ratio = wcagRatio(color(theme, "line"), color(theme, "bg"));
			expect(ratio, `${theme}: line on bg = ${ratio.toFixed(2)}`).toBeLessThan(
				3,
			);
		});
	}
});
