import { describe, expect, it } from "vitest";
import {
	type ColorValue,
	flatten,
	readTokens,
	resolve,
	THEMES,
	type Token,
} from "../scripts/load.mjs";

const ROLES = [
	"bg",
	"surface",
	"surface-raised",
	"line",
	"line-strong",
	"text-strong",
	"text",
	"text-muted",
	"text-subtle",
	"link",
	"link-hover",
	"accent",
	"on-accent",
	"focus-ring",
	"success",
	"warning",
	"danger",
	"on-danger",
	"info",
	"cable-1",
	"cable-2",
	"cable-3",
	"backdrop",
];

const resolved = resolve(flatten(await readTokens()));
const get = (path: string) => {
	const token = resolved.get(path);
	if (!token) throw new Error(`missing ${path}`);
	return token;
};
const hex = (theme: string, role: string) =>
	(get(`theme.${theme}.color.${role}`).$value as ColorValue).hex;

// [role, schematic, night, light] from DESIGN.md « Tokens sémantiques »
const TABLE: [string, string, string, string][] = [
	["bg", "#050608", "#070A1F", "#F5F3EC"],
	["surface", "#07090D", "#0D1233", "#FBFAF6"],
	["surface-raised", "#0C1119", "#141A45", "#FFFFFF"],
	["line", "#2B4A75", "#1C2250", "#AFC1D6"],
	["line-strong", "#8EC5FF", "#5A68C8", "#1F4FB8"],
	["text-strong", "#F2F7FF", "#E4E7FF", "#050608"],
	["text", "#DCE8F7", "#E4E7FF", "#0C1119"],
	["text-muted", "#AFC1D6", "#B9C0EA", "#3A4A63"],
	["text-subtle", "#9CB0C8", "#9AA3D6", "#56657D"],
	["link", "#8EC5FF", "#8EC5FF", "#1F4FB8"],
	["link-hover", "#C6E2FF", "#C6E2FF", "#1F4FB8"],
	["accent", "#FF4F7B", "#3DDC6B", "#BF1F4B"],
	["on-accent", "#050608", "#070A1F", "#FFFFFF"],
	["focus-ring", "#FF4F7B", "#B9A8FF", "#BF1F4B"],
	["success", "#3DDC6B", "#3DDC6B", "#15703A"],
	["warning", "#FF9A3C", "#FF9A3C", "#A8530A"],
	["danger", "#FF5A36", "#FF5A36", "#B8260F"],
	["on-danger", "#050608", "#070A1F", "#FFFFFF"],
	["info", "#8EC5FF", "#8EC5FF", "#1F4FB8"],
	["cable-1", "#FF4F7B", "#3B55E6", "#FF4F7B"],
	["cable-2", "#5B8CFF", "#3DDC6B", "#5B8CFF"],
	["cable-3", "#FF9A3C", "#B9A8FF", "#FF9A3C"],
	["backdrop", "#050608", "#070A1F", "#0C1119"],
];

describe("semantic themes", () => {
	it("each theme defines exactly the role list", () => {
		for (const theme of THEMES) {
			const prefix = `theme.${theme}.color.`;
			const roles = [...resolved.keys()]
				.filter((p) => p.startsWith(prefix))
				.map((p) => p.slice(prefix.length));
			expect(new Set(roles)).toEqual(new Set(ROLES));
		}
	});

	it("values follow DESIGN.md", () => {
		expect(TABLE.map(([r]) => r)).toEqual(ROLES);
		for (const [role, schematic, night, light] of TABLE) {
			expect([role, hex("schematic", role)]).toEqual([role, schematic]);
			expect([role, hex("night", role)]).toEqual([role, night]);
			expect([role, hex("light", role)]).toEqual([role, light]);
		}
	});

	it("keeps the alias string on resolved role tokens", () => {
		expect(get("theme.night.color.accent").aliasOf).toBe("{color.vivant.400}");
		expect(get("theme.night.color.accent").$type).toBe("color");
	});

	it("backdrop keeps alpha", () => {
		const bd = (t: string) =>
			get(`theme.${t}.color.backdrop`).$value as ColorValue;
		const ink950 = get("color.ink.950").$value as ColorValue;
		const ink900 = get("color.ink.900").$value as ColorValue;
		expect(bd("schematic").components).toEqual(ink950.components);
		expect(bd("schematic").alpha).toBe(0.72);
		expect(bd("light").components).toEqual(ink900.components);
		expect(bd("light").alpha).toBe(0.4);
	});

	it("radius by theme", () => {
		const r = (t: string) =>
			["sm", "md", "lg", "pill"].map(
				(k) =>
					(
						get(`theme.${t}.radius.${k}`).$value as {
							value: number;
							unit: string;
						}
					).value,
			);
		expect(r("schematic")).toEqual([0, 0, 0, 0]);
		expect(r("light")).toEqual([0, 0, 0, 0]);
		expect(r("night")).toEqual([2, 4, 6, 999]);
		expect(get("theme.night.radius.sm").$type).toBe("dimension");
	});

	it("glow", () => {
		type Shadow = {
			color: ColorValue;
			offsetX: { value: number };
			offsetY: { value: number };
			blur: { value: number };
			spread: { value: number };
		};
		const glow = (t: string) => get(`theme.${t}.shadow.glow`).$value as Shadow;
		const check = (
			t: string,
			prim: string,
			alpha: number,
			x: number,
			blur: number,
		) => {
			const g = glow(t);
			const p = get(prim).$value as ColorValue;
			expect(g.color.components).toEqual(p.components);
			expect(g.color.alpha).toBe(alpha);
			expect([
				g.offsetX.value,
				g.offsetY.value,
				g.blur.value,
				g.spread.value,
			]).toEqual([x, x, blur, 0]);
		};
		check("schematic", "color.trace.300", 0.12, 0, 32);
		check("night", "color.matrix.500", 0.2, 0, 32);
		check("light", "color.blue.700", 0.1, 6, 0);
	});

	it("icon cap", () => {
		expect(get("theme.schematic.icon.cap").$value).toBe("square");
		expect(get("theme.light.icon.cap").$value).toBe("square");
		expect(get("theme.night.icon.cap").$value).toBe("round");
	});
});

describe("resolve", () => {
	const tok = (v: unknown): Token => ({ $type: "color", $value: v });
	it("unknown alias throws with path", () => {
		const m = new Map([["a.b", tok("{x.y}")]]);
		expect(() => resolve(m)).toThrow("Unknown alias {x.y} in a.b");
	});
	it("alias cycle throws", () => {
		const m = new Map([
			["a", tok("{b}")],
			["b", tok("{a}")],
		]);
		expect(() => resolve(m)).toThrow("Alias cycle: a → b → a");
	});
});
