import { beforeAll, describe, expect, it } from "vitest";
import { flatten, readTokens, type Token } from "../scripts/load.mjs";

let tokens: Map<string, Token>;
beforeAll(async () => {
	tokens = flatten(await readTokens());
});

const px = (value: number) => ({ value, unit: "px" });
const ms = (value: number) => ({ value, unit: "ms" });
const get = (path: string) => {
	const token = tokens.get(path);
	if (!token) throw new Error(`missing token ${path}`);
	return token;
};

const DISPLAY = ["fs0 Mono", "Martian Mono", "ui-monospace", "monospace"];
const SANS = ["Inter Tight", "system-ui", "sans-serif"];

describe("fonts", () => {
	it.each([
		["font.display", DISPLAY],
		["font.sans", SANS],
		["font.mono", DISPLAY],
	])("%s is a fontFamily stack", (path, stack) => {
		expect(get(path).$type).toBe("fontFamily");
		expect(get(path).$value).toEqual(stack);
	});

	it.each([
		["font.display-stretch", "75%"],
		["font.mono-stretch", "100%"],
	])("%s is a raw %s", (path, value) => {
		expect(get(path).$value).toBe(value);
		expect(get(path).$extensions).toEqual({ "fs0.raw": true });
	});
});

// [name, size, line-height, tracking, weight]
const TEXT: [string, number, number, string, number][] = [
	["2xs", 11, 16, "0.04em", 500],
	["xs", 12, 18, "0.02em", 500],
	["sm", 14, 21, "0em", 400],
	["md", 16, 26, "0em", 400],
	["lg", 18, 28, "-0.005em", 400],
	["xl", 28, 32, "-0.02em", 700],
];

describe("text scale", () => {
	it.each(TEXT)("text.%s", (name, size, lh, tracking, weight) => {
		expect(get(`text.${name}.size`)).toMatchObject({
			$type: "dimension",
			$value: px(size),
		});
		expect(get(`text.${name}.line-height`)).toMatchObject({
			$type: "dimension",
			$value: px(lh),
		});
		expect(get(`text.${name}.tracking`).$value).toBe(tracking);
		expect(get(`text.${name}.weight`)).toMatchObject({
			$type: "fontWeight",
			$value: weight,
		});
	});

	it.each([
		["2xl", "clamp(40px, 4vw + 1rem, 76px)", 0.92, "-0.04em"],
		["display", "clamp(56px, 8vw, 108px)", 0.9, "-0.04em"],
	])("text.%s is fluid", (name, size, lh, tracking) => {
		expect(get(`text.${name}.size`)).toEqual({
			$type: "dimension",
			$value: size,
			$extensions: { "fs0.raw": true },
		});
		expect(get(`text.${name}.line-height`)).toMatchObject({
			$type: "number",
			$value: lh,
		});
		expect(get(`text.${name}.tracking`).$value).toBe(tracking);
		expect(get(`text.${name}.weight`).$value).toBe(800);
	});
});

describe("size", () => {
	it.each([
		[1, 4],
		[2, 8],
		[3, 12],
		[4, 16],
		[5, 20],
		[6, 24],
		[8, 32],
		[10, 40],
		[12, 48],
		[16, 64],
		[24, 96],
	])("space.%s = %spx", (name, value) => {
		expect(get(`space.${name}`)).toMatchObject({
			$type: "dimension",
			$value: px(value),
		});
	});

	it.each([
		["width.narrow", 720],
		["width.content", 1152],
		["width.wide", 1280],
		["control.sm", 32],
		["control.md", 44],
		["control.lg", 52],
		["stroke.hairline", 1],
		["stroke.tick", 2],
		["stroke.focus", 2],
		["stroke.cable-sm", 5],
		["stroke.cable-md", 6],
		["stroke.cable-lg", 7],
		["icon.16", 16],
		["icon.20", 20],
		["icon.24", 24],
		["icon.32", 32],
	])("%s = %spx", (path, value) => {
		expect(get(path)).toMatchObject({
			$type: "dimension",
			$value: px(value),
		});
	});

	it("measure is a raw 68ch", () => {
		expect(get("measure")).toEqual({
			$type: "dimension",
			$value: "68ch",
			$extensions: { "fs0.raw": true },
		});
	});

	it("icon strokes", () => {
		expect(get("icon.stroke.small")).toMatchObject({
			$type: "number",
			$value: 1.5,
		});
		expect(get("icon.stroke.large")).toMatchObject({
			$type: "number",
			$value: 1.25,
		});
	});
});

describe("motion", () => {
	it.each([
		["instant", 120],
		["fast", 150],
		["base", 250],
		["moderate", 450],
		["slow", 700],
		["draw", 1400],
	])("duration.%s = %sms", (name, value) => {
		expect(get(`duration.${name}`)).toMatchObject({
			$type: "duration",
			$value: ms(value),
		});
	});

	it.each([
		["standard", [0.165, 0.84, 0.44, 1]],
		["rise", [0.23, 1, 0.32, 1]],
		["draw", [0.645, 0.045, 0.355, 1]],
		["boot", [0.19, 1, 0.22, 1]],
	])("ease.%s", (name, value) => {
		expect(get(`ease.${name}`)).toMatchObject({
			$type: "cubicBezier",
			$value: value,
		});
	});

	it.each([
		["glitch", "steps(1)"],
		["linear", "linear"],
	])("ease.%s is raw", (name, value) => {
		expect(get(`ease.${name}`).$value).toBe(value);
		expect(get(`ease.${name}`).$extensions).toEqual({ "fs0.raw": true });
	});
});

describe("repo-wide rules", () => {
	const DTCG = new Set([
		"color",
		"dimension",
		"fontFamily",
		"fontWeight",
		"duration",
		"cubicBezier",
		"number",
		"strokeStyle",
		"border",
		"transition",
		"shadow",
		"gradient",
		"typography",
	]);

	it("every $type is DTCG or flagged fs0.raw", () => {
		const bad = [...tokens]
			.filter(([, t]) => !t.$extensions?.["fs0.raw"])
			.filter(([, t]) => !t.$type || !DTCG.has(t.$type))
			.map(([path]) => path);
		expect(bad).toEqual([]);
	});

	it("tracking tokens use ASCII hyphen-minus", () => {
		for (const [path, t] of tokens) {
			if (path.endsWith(".tracking")) expect(t.$value).not.toMatch(/−/);
		}
	});

	it("base token files do not use the color or theme root keys", async () => {
		const dir = new URL("../tokens/base", import.meta.url).pathname;
		const roots = new Set(Object.keys(await readTokens(dir)));
		expect(roots.size).toBeGreaterThan(0);
		for (const reserved of ["color", "theme"]) {
			expect(roots.has(reserved)).toBe(false);
		}
	});
});
