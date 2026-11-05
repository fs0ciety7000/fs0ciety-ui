import { type Color, differenceCiede2000, oklch } from "culori";
import { describe, expect, it } from "vitest";
import { flatten, readTokens } from "../scripts/load.mjs";

const ANCHORS = [
	"ink-950",
	"ink-925",
	"ink-900",
	"ink-700",
	"ink-600",
	"ink-400",
	"ink-300",
	"ink-200",
	"ink-100",
	"ink-50",
	"trace-200",
	"trace-300",
	"trace-800",
	"blue-500",
	"blue-700",
	"coral-500",
	"coral-700",
	"red-500",
	"red-700",
	"ember-500",
	"ember-800",
	"vivant-400",
	"vivant-700",
	"indigo-950",
	"indigo-900",
	"indigo-850",
	"indigo-800",
	"indigo-500",
	"indigo-300",
	"indigo-200",
	"indigo-100",
	"matrix-500",
	"lavender-300",
	"paper-100",
	"paper-50",
];

type ColorValue = { colorSpace: string; components: number[]; hex: string };

const colors = async () => {
	const flat = flatten(await readTokens());
	return [...flat].filter(([path]) => path.startsWith("color."));
};

describe("color primitives", () => {
	it("every primitive from DESIGN.md exists", async () => {
		expect(ANCHORS).toHaveLength(35);
		const flat = flatten(await readTokens());
		for (const a of ANCHORS) {
			const [hue, step] = a.split("-");
			const t = flat.get(`color.${hue}.${step}`);
			expect(t, a).toBeDefined();
			expect(t?.$type).toBe("color");
		}
		expect(flat.has("color.white")).toBe(true);
	});

	it("oklch components match the hex anchor", async () => {
		const diff = differenceCiede2000();
		for (const [path, t] of await colors()) {
			const v = t.$value as ColorValue;
			expect(v.colorSpace, path).toBe("oklch");
			const [l, c, h] = v.components as [number, number, number];
			expect(l, path).toBeGreaterThanOrEqual(0);
			expect(l, path).toBeLessThanOrEqual(1);
			const d = diff(oklch(v.hex) as Color, { mode: "oklch", l, c, h });
			expect(d, path).toBeLessThan(0.5);
		}
	});

	it("exact anchors", async () => {
		const flat = flatten(await readTokens());
		const hex = (p: string) =>
			(flat.get(p)?.$value as ColorValue | undefined)?.hex;
		expect(hex("color.ink.950")).toBe("#050608");
		expect(hex("color.red.500")).toBe("#FF5A36");
		expect(hex("color.indigo.500")).toBe("#5A68C8");
		expect(hex("color.white")).toBe("#FFFFFF");
	});

	it("duplicate paths throw", async () => {
		await expect(
			readTokens(new URL("./fixtures/dup", import.meta.url).pathname),
		).rejects.toThrow(/color\.ink\.950/);
	});
});
