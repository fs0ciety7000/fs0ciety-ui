import { readFileSync } from "node:fs";
import { join } from "node:path";
import { transform } from "lightningcss";
import { describe, expect, it } from "vitest";
import { printValue, type Rule, root, rulesOf } from "./helpers";

// biome-ignore lint/suspicious/noExplicitAny: lightningcss AST nodes are untyped here.
type Any = any;

const rules = rulesOf("effects");
const norm = (s: string) =>
	s
		.replace(/\s+/g, " ")
		.replace(/="([^"]*)"/g, "=$1")
		// lightningcss prints legacy single-colon pseudo-elements and ".0" percentages.
		.replace(/\s*>\s*/g, " > ")
		.replace(/::(before|after)/g, ":$1")
		.replace(/(\d)\.0%/g, "$1%")
		.trim();
const sels = (r: Rule) => r.selectors.map(norm);
const decl = (r: Rule | undefined, p: string) =>
	r?.declarations.find((d) => d.property === p);
const REDUCE = "prefers-reduced-motion";

const inMedia = (m: string) =>
	rules.filter((r) => r.media?.includes(m.replace(/\s+/g, "")));
const hasSel = (r: Rule, s: string) => sels(r).includes(norm(s));
const find = (s: string, pred: (r: Rule) => boolean = () => true) =>
	rules.find((r) => hasSel(r, s) && pred(r));

type Frame = { offsets: number[]; decls: Record<string, string> };
function keyframesOf(file: string): Record<string, Frame[]> {
	const raw: { name: string; frames: Any[] }[] = [];
	transform({
		filename: file,
		code: readFileSync(join(root, "src", file)),
		visitor: {
			Rule: {
				keyframes(rule: Any) {
					raw.push({
						name: rule.value.name.value,
						frames: rule.value.keyframes,
					});
					return undefined;
				},
			},
		},
	});
	const out: Record<string, Frame[]> = {};
	for (const { name, frames } of raw)
		out[name] = frames.map((f) => ({
			offsets: f.selectors.map((s: Any) =>
				s.type === "percentage"
					? Math.round(s.value * 10000) / 100
					: s.type === "from"
						? 0
						: 100,
			),
			decls: Object.fromEntries(
				f.declarations.declarations.map((d: Any) => [
					d.property === "unparsed" ? d.value.propertyId.property : d.property,
					norm(printValue(d)),
				]),
			),
		}));
	return out;
}

describe("effects layer", () => {
	it("everything lives in fs.effects", () => {
		expect(rules.length).toBeGreaterThan(10);
		expect(rules.every((r) => r.layer === "fs.effects")).toBe(true);
	});
});

describe("effects: values", () => {
	it("scan overlay", () => {
		const host = find('[data-fs-fx~="scan"]');
		expect(decl(host, "position")?.value).toBe("relative");
		expect(decl(host, "isolation")?.value).toBe("isolate");
		const o = find('[data-fs-fx~="scan"]::after', (r) => !r.media);
		expect(decl(o, "inset")?.value).toMatch(/^0/);
		expect(decl(o, "z-index")?.value).toBe("-1");
		const bg = norm(decl(o, "background-image")?.value ?? "");
		expect(bg).toContain("repeating-linear-gradient(0deg");
		expect(bg).toContain("var(--fs-link) 5%");
		expect(
			rules.filter((r) => sels(r).some((x) => x.includes(">"))),
			"no rule targets children",
		).toEqual([]);
	});

	it("scan and sweep are hidden in the light theme and the OS-light fallback", () => {
		for (const part of ["after", "before"]) {
			const fx = part === "after" ? "scan" : "sweep";
			const p = `[data-fs-fx~="${fx}"]::${part}`;
			const a = find(`[data-fs-theme="light"] ${p}`);
			const b = find(`[data-fs-theme="light"]${p}`);
			const c = find(
				`:root:not([data-fs-theme]) ${p}`,
				(r) => !!r.media?.includes("prefers-color-scheme:light"),
			);
			const d = find(
				`:root:not([data-fs-theme])${p}`,
				(r) => !!r.media?.includes("prefers-color-scheme:light"),
			);
			for (const r of [a, b, c, d]) {
				expect(r, `${fx}`).toBeDefined();
				expect(decl(r, "display")?.value).toBe("none");
			}
		}
	});

	it("sweep band", () => {
		const host = find('[data-fs-fx~="sweep"]');
		expect(decl(host, "position")?.value).toBe("relative");
		expect(decl(host, "isolation")?.value).toBe("isolate");
		expect(decl(host, "overflow")).toBeUndefined();
		const b = find('[data-fs-fx~="sweep"]::before', (r) => !r.media);
		expect(decl(b, "position")?.value).toBe("absolute");
		expect(decl(b, "inset")?.value).toMatch(/^0/);
		expect(norm(decl(b, "background-size")?.value ?? "")).toBe("100% 60px");
		expect(decl(b, "background-repeat")?.value).toBe("no-repeat");
		expect(decl(b, "z-index")?.value).toBe("-1");
		expect(decl(b, "animation")?.value).toMatch(
			/^5s linear infinite fs-sweep$/,
		);
		expect(norm(decl(b, "background-image")?.value ?? "")).toContain(
			"var(--fs-link) 7%",
		);
		expect(keyframesOf("effects.css")["fs-sweep"]).toEqual([
			{ offsets: [0], decls: { "background-position": "0 -60px" } },
			{
				offsets: [100],
				decls: { "background-position": "0 calc(100% + 60px)" },
			},
		]);
	});

	it("bleed shadow", () => {
		const b = find('[data-fs-fx~="bleed"]', (r) => !r.media);
		const v = norm(decl(b, "text-shadow")?.value ?? "");
		expect(v).toContain("-2px 0 color-mix(in oklch, var(--fs-cable-1) 85%");
		expect(v).toContain("2px 0 color-mix(in oklch, var(--fs-link) 85%");
		expect(decl(b, "animation")?.value).toMatch(
			/^4s (steps\(1\)|step-end) infinite fs-bleed-jitter$/,
		);
	});

	it("grid lines", () => {
		const g = find('[data-fs-fx~="grid"]', (r) => !r.media);
		const bg = norm(decl(g, "background-image")?.value ?? "");
		expect(bg).toContain("var(--fs-line) 12%");
		expect(bg).toContain("var(--fs-line) 35%");
		const size = norm(decl(g, "background-size")?.value ?? "");
		expect(size).toContain("8px 8px");
		expect(size).toContain("64px 64px");
	});

	it("glitch-hover", () => {
		const base = find('[data-fs-fx~="glitch-hover"]', (r) => !r.media);
		const t = norm(decl(base, "transition")?.value ?? "");
		expect(t).toContain("transform var(--fs-duration-instant) steps(2)");
		expect(t).toContain("box-shadow var(--fs-duration-instant) steps(2)");
		const h = find('[data-fs-fx~="glitch-hover"]:hover', (r) => !r.media);
		expect(h && sels(h)).toContain(
			norm('[data-fs-fx~="glitch-hover"]:focus-visible'),
		);
		expect(norm(decl(h, "transform")?.value ?? "")).toMatch(
			/^translate(X)?\(-2px\)$/,
		);
		expect(norm(decl(h, "box-shadow")?.value ?? "")).toBe(
			"4px 0 0 var(--fs-link), -4px 0 0 var(--fs-cable-3)",
		);
	});

	it("cursor", () => {
		const c = find(".fs-cursor", (r) => !r.media);
		expect(decl(c, "display")?.value).toBe("inline-block");
		expect(decl(c, "width")?.value).toBe(".6em");
		expect(decl(c, "height")?.value).toBe("1em");
		expect(decl(c, "background")?.value).toMatch(/currentColor/i);
		expect(decl(c, "vertical-align")?.value).toBe("text-bottom");
		expect(decl(c, "animation")?.value).toMatch(
			/^1s (steps\(1\)|step-end) infinite fs-cursor-blink$/,
		);
	});
});

describe("effects: motion", () => {
	const animated = rules.filter(
		(r) =>
			!r.media &&
			r.declarations.some(
				(d) => d.property === "animation" || d.property === "animation-name",
			),
	);
	const animatedSelectors = animated.flatMap(sels);

	it("every animated rule is neutralised", () => {
		expect(animatedSelectors.sort()).toEqual(
			[
				".fs-cursor",
				"[data-fs-fx~=bleed]",
				"[data-fs-fx~=sweep]:before",
			].sort(),
		);
		const reduce = inMedia(REDUCE);
		const paused = rules.filter((r) =>
			r.declarations.some(
				(d) => d.property === "animation-play-state" && d.value === "paused",
			),
		);
		for (const s of animatedSelectors) {
			const killers = reduce.filter(
				(r) =>
					sels(r).includes(s) &&
					decl(r, "animation")?.value === "none" &&
					decl(r, "animation")?.important,
			);
			expect(killers.length, `reduce: ${s}`).toBeGreaterThan(0);
			const [compound = "", pseudo = ""] = s.split(/:(?=before|after)/);
			const covered = (self: boolean) =>
				paused.some((r) =>
					sels(r).some(
						(x) =>
							x.startsWith("[data-fs-motion=paused]") &&
							(self
								? !x.startsWith("[data-fs-motion=paused] ")
								: x.startsWith("[data-fs-motion=paused] ")) &&
							x.includes(compound) &&
							(pseudo ? x.endsWith(`:${pseudo}`) : !/:(before|after)$/.test(x)),
					),
				);
			expect(covered(false), `paused descendant: ${s}`).toBe(true);
			expect(covered(true), `paused self: ${s}`).toBe(true);
		}
	});

	it("reduced motion hides sweep, kills glitch-hover, keeps cursor solid", () => {
		const reduce = inMedia(REDUCE);
		const sweep = reduce.find(
			(r) =>
				hasSel(r, '[data-fs-fx~="sweep"]::before') &&
				decl(r, "display")?.value === "none",
		);
		expect(decl(sweep, "display")?.important).toBe(true);
		const base = reduce.find((r) => hasSel(r, '[data-fs-fx~="glitch-hover"]'));
		expect(decl(base, "transition")?.value).toBe("none");
		expect(decl(base, "transition")?.important).toBe(true);
		expect(
			decl(base, "transform"),
			"resting transform survives",
		).toBeUndefined();
		expect(decl(base, "box-shadow"), "resting shadow survives").toBeUndefined();
		const g = reduce.find((r) =>
			hasSel(r, '[data-fs-fx~="glitch-hover"]:hover'),
		);
		for (const p of ["transform", "box-shadow"]) {
			expect(decl(g, p)?.value, p).toBe("none");
			expect(decl(g, p)?.important, p).toBe(true);
		}
		expect(g && sels(g)).toContain(
			norm('[data-fs-fx~="glitch-hover"]:focus-visible'),
		);
		const c = reduce.find((r) => hasSel(r, ".fs-cursor") && decl(r, "opacity"));
		expect(decl(c, "opacity")?.value).toBe("1");
	});

	it("bleed keeps a static shadow under reduced motion", () => {
		const base = find('[data-fs-fx~="bleed"]', (r) => !r.media);
		expect(decl(base, "text-shadow")).toBeDefined();
		for (const r of inMedia(REDUCE))
			if (hasSel(r, '[data-fs-fx~="bleed"]'))
				expect(
					decl(r, "text-shadow"),
					"reduce must not clear it",
				).toBeUndefined();
	});

	it("overlays never eat clicks", () => {
		const overlays = rules.filter(
			(r) =>
				r.selectorAsts.some(
					(ast) =>
						ast.some((c) => c.type === "pseudo-element") &&
						ast.some((c) => c.type === "attribute"),
				) && decl(r, "content"),
		);
		expect(overlays.length).toBeGreaterThanOrEqual(2);
		for (const r of overlays)
			expect(decl(r, "pointer-events")?.value, r.selectors.join()).toBe("none");
	});

	it("contrast-more and forced-colors remove scan, sweep, grid, bleed, glitch", () => {
		for (const media of ["prefers-contrast: more", "forced-colors: active"]) {
			const m = inMedia(media);
			for (const s of [
				'[data-fs-fx~="scan"]::after',
				'[data-fs-fx~="sweep"]::before',
			]) {
				const r = m.find((x) => hasSel(x, s));
				expect(decl(r, "display")?.value, `${media} ${s}`).toBe("none");
			}
			const grid = m.find((x) => hasSel(x, '[data-fs-fx~="grid"]'));
			expect(decl(grid, "background-image")?.value, media).toBe("none");
			const bleed = m.find((x) => hasSel(x, '[data-fs-fx~="bleed"]'));
			expect(decl(bleed, "text-shadow")?.value, media).toBe("none");
			expect(decl(bleed, "animation")?.value, media).toBe("none");
			const gh = m.find((x) => hasSel(x, '[data-fs-fx~="glitch-hover"]:hover'));
			expect(decl(gh, "transform")?.value, media).toBe("none");
			expect(decl(gh, "box-shadow")?.value, media).toBe("none");
		}
		for (const r of inMedia("prefers-contrast: more"))
			expect(r.declarations.some((d) => d.important)).toBe(false);
	});

	it("jitter keyframes match D", () => {
		const frames = keyframesOf("effects.css")["fs-bleed-jitter"] ?? [];
		const byOffset = (o: number) =>
			frames.find((f) => f.offsets.includes(o))?.decls["text-shadow"] ?? "";
		const rest = byOffset(0);
		expect(frames.find((f) => f.offsets.includes(0))?.offsets).toEqual([
			0, 88, 100,
		]);
		expect(byOffset(88)).toBe(rest);
		expect(byOffset(100)).toBe(rest);
		expect(rest).toContain("-2px 0 color-mix(in oklch, var(--fs-cable-1) 85%");
		expect(rest).toContain("2px 0 color-mix(in oklch, var(--fs-link) 85%");
		const at90 = byOffset(90);
		expect(at90).toContain("-6px 0 color-mix(in oklch, var(--fs-cable-1) 90%");
		expect(at90).toContain("5px 1px color-mix(in oklch, var(--fs-link) 90%");
		const at93 = byOffset(93);
		expect(at93).toContain("3px 0 color-mix(in oklch, var(--fs-cable-1) 90%");
		expect(at93).toContain("-4px 0 color-mix(in oklch, var(--fs-link) 90%");
		expect(frames.length).toBe(3);
	});

	it("!important only appears in reduced-motion or forced-colors", () => {
		const important = rules.filter((r) =>
			r.declarations.some((d) => d.important),
		);
		expect(important.length).toBeGreaterThan(0);
		for (const r of important)
			expect(
				/prefers-reduced-motion|forced-colors/.test(r.media ?? ""),
				r.selectors.join(),
			).toBe(true);
	});

	it("forced colors keeps the cursor visible", () => {
		const c = inMedia("forced-colors: active").find((r) =>
			hasSel(r, ".fs-cursor"),
		);
		expect(decl(c, "forced-color-adjust")?.value).toBe("none");
		expect(decl(c, "background")?.value).toMatch(/CanvasText/i);
	});

	it("cursor blinks at 1 Hz", () => {
		const f = keyframesOf("effects.css")["fs-cursor-blink"] ?? [];
		expect(f).toEqual([
			{ offsets: [0, 50], decls: { opacity: "1" } },
			{ offsets: [50.01, 100], decls: { opacity: "0" } },
		]);
	});
});
