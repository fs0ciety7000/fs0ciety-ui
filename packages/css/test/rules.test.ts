import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
	type Component,
	colorViolations,
	isExemptSelector,
	isZeroSpecificity,
	parseCss,
	type Rule,
	root,
	rulesOf,
} from "./helpers";

const srcFiles = readdirSync(join(root, "src")).filter((f) =>
	f.endsWith(".css"),
);
const violationsOf = (rules: Rule[]) =>
	rules.flatMap((r) => r.declarationAsts.flatMap(colorViolations));

const norm = (s: string) => s.replace(/\s+/g, " ").trim();
const nows = (s: string | undefined) =>
	(s ?? "").replace(/\s+/g, "").replace("100.0%", "100%");
const decl = (rule: Rule, property: string) =>
	rule.declarations.find((d) => d.property === property)?.value;
const find = (rules: Rule[], selector: string, media?: string) =>
	rules.find(
		(r) =>
			r.selectors.map(norm).join(",") === selector &&
			(media === undefined ? !r.media : r.media?.includes(media)),
	);

describe("no primitive tokens or literal colors", () => {
	it.each(srcFiles)("src/%s is clean", (file) => {
		expect(violationsOf(rulesOf(file))).toEqual([]);
	});

	it("fails on a primitive token", () => {
		const v = violationsOf(rulesOf("test/fixtures/primitive-token.css"));
		expect(v).toEqual(["primitive token --fs-color-ink-950"]);
	});

	it("fails on a hex color", () => {
		expect(
			violationsOf(rulesOf("test/fixtures/literal-hex.css")).length,
		).toBeGreaterThan(0);
	});

	it("fails on named colors and color functions", () => {
		const v = violationsOf(rulesOf("test/fixtures/literal-named.css"));
		expect(v.length).toBeGreaterThanOrEqual(2);
	});

	it("allows system colors, keywords, transparent and semantic tokens", () => {
		expect(violationsOf(rulesOf("test/fixtures/allowed-colors.css"))).toEqual(
			[],
		);
	});
});

describe("specificity", () => {
	it("reset and base element selectors have zero specificity", () => {
		const offenders: string[] = [];
		for (const file of ["reset", "base"]) {
			for (const rule of rulesOf(file)) {
				rule.selectorAsts.forEach((ast, i) => {
					const text = rule.selectors[i] ?? "";
					if (!isZeroSpecificity(ast) && !isExemptSelector(text))
						offenders.push(`${file}: ${text}`);
				});
			}
		}
		expect(offenders).toEqual([]);
		expect(rulesOf("reset").length).toBeGreaterThan(5);
		expect(rulesOf("base").length).toBeGreaterThan(10);
	});

	it("!important is absent from reset and base", () => {
		const imp = ["reset", "base"].flatMap((f) =>
			rulesOf(f).flatMap((r) => r.declarations.filter((d) => d.important)),
		);
		expect(imp).toEqual([]);
	});
});

describe("specificity helpers", () => {
	const sel = (css: string) =>
		parseCss(`${css}{color:red}`)[0]?.selectorAsts[0] ?? [];

	it("isExemptSelector matches exact allowed selectors only", () => {
		for (const ok of [
			":root",
			"[data-fs-theme=light]",
			"[data-fs-theme]",
			":root:not([data-fs-theme])",
			":focus-visible",
			"::selection",
		])
			expect(isExemptSelector(ok), ok).toBe(true);
		for (const bad of [
			":root .card",
			":root > body",
			"[data-fs-theme] a",
			"[data-fs-theme=sepia]",
			":focus-visible > a",
			".fs-card",
		])
			expect(isExemptSelector(bad), bad).toBe(false);
	});

	it("isZeroSpecificity accepts a pseudo-element only last and after :where()", () => {
		expect(isZeroSpecificity(sel(":where(*)::before"))).toBe(true);
		expect(isZeroSpecificity(sel(":where(a)"))).toBe(true);
		expect(isZeroSpecificity(sel("::before"))).toBe(false);
		expect(isZeroSpecificity(sel(":where(a) > ::before"))).toBe(false);
		const [where, before] = sel(":where(a)::before") as [Component, Component];
		expect(isZeroSpecificity([before, where])).toBe(false);
		expect(isZeroSpecificity(sel(".x::before"))).toBe(false);
	});
});

describe("base", () => {
	const base = rulesOf("base");

	it("focus ring per DESIGN", () => {
		const rule = find(base, ":focus-visible");
		expect(rule).toBeDefined();
		expect(norm(decl(rule as Rule, "outline") ?? "")).toBe(
			"var(--fs-stroke-focus) solid var(--fs-focus-ring)",
		);
		expect(decl(rule as Rule, "outline-offset")).toBe("2px");
		expect(find(base, ":focus:not(:focus-visible)")).toBeDefined();
	});

	it("contrast-more remaps line and text-subtle on every theme scope", () => {
		const rule = base.find((r) => r.media?.includes("prefers-contrast"));
		expect(rule).toBeDefined();
		expect(rule?.selectors.map(norm)).toEqual([":root", "[data-fs-theme]"]);
		expect(decl(rule as Rule, "--fs-line")).toBe("var(--fs-line-strong)");
		expect(decl(rule as Rule, "--fs-text-subtle")).toBe("var(--fs-text-muted)");
	});

	it("forced-colors keeps a visible focus ring", () => {
		const rule = base.find((r) => r.media?.includes("forced-colors"));
		expect(rule?.selectors.map(norm)).toEqual([":focus-visible"]);
		expect(decl(rule as Rule, "outline-color")).toBe("highlight");
	});

	it("color-scheme per theme", () => {
		const scheme = (selector: string, media?: string) =>
			decl(find(base, selector, media) as Rule, "color-scheme");
		expect(
			scheme(":root,[data-fs-theme=schematic],[data-fs-theme=night]"),
		).toBe("dark");
		expect(scheme("[data-fs-theme=light]")).toBe("light");
		const fallback = base.find(
			(r) =>
				r.media?.includes("prefers-color-scheme") &&
				r.selectors.some((s) => s.startsWith(":root:not(")),
		);
		expect(decl(fallback as Rule, "color-scheme")).toBe("light");
	});

	it("html sets 16px+ body text from md tokens", () => {
		const html = find(base, ":where(html)");
		expect(decl(html as Rule, "font-size")).toBe("var(--fs-text-md-size)");
		expect(decl(html as Rule, "line-height")).toBe(
			"var(--fs-text-md-line-height)",
		);
	});

	it("headings use the display and sans token scales", () => {
		const h12 = find(base, ":where(h1,h2)") ?? find(base, ":where(h1, h2)");
		expect(decl(h12 as Rule, "font-family")).toBe("var(--fs-font-display)");
		expect(decl(h12 as Rule, "text-transform")).toBe("uppercase");
		const h1 = find(base, ":where(h1)");
		expect(decl(h1 as Rule, "font-size")).toBe("var(--fs-text-2xl-size)");
		const h2 = find(base, ":where(h2)");
		expect(decl(h2 as Rule, "font-size")).toBe("var(--fs-text-xl-size)");
	});
});

describe("utilities", () => {
	const util = rulesOf("utilities");
	const LIST = [
		"fs-sr-only",
		"fs-sr-only-focusable",
		"fs-container",
		"fs-container-narrow",
		"fs-container-wide",
		"fs-stack",
		"fs-cluster",
		"fs-measure",
		"fs-text-2xs",
		"fs-text-xs",
		"fs-text-sm",
		"fs-text-md",
		"fs-text-lg",
		"fs-text-xl",
		"fs-text-2xl",
		"fs-text-display",
		"fs-label",
		"fs-mono",
		"fs-display",
		"fs-tabular",
		"fs-muted",
		"fs-subtle",
	];
	const classesOf = (rules: Rule[]) =>
		new Set(
			rules.flatMap((r) =>
				r.selectorAsts.flatMap((ast) =>
					ast.filter((c) => c.type === "class").map((c) => c.name as string),
				),
			),
		);
	const single = (name: string) =>
		util.find(
			(r) =>
				!r.media && r.selectors.length === 1 && r.selectors[0] === `.${name}`,
		) as Rule;

	it("is wrapped in the fs.utilities layer", () => {
		expect(util.every((r) => r.layer === "fs.utilities")).toBe(true);
	});

	it("defines exactly the listed classes (no scope creep)", () => {
		expect([...classesOf(util)].sort()).toEqual([...LIST].sort());
	});

	it("every class is a plain class selector (specificity 0,1,0)", () => {
		for (const r of util)
			for (const ast of r.selectorAsts)
				expect(
					ast.filter((c) => c.type === "class").length,
					r.selectors.join(),
				).toBe(1);
		for (const name of LIST.filter((n) => n !== "fs-sr-only-focusable"))
			expect(single(name), name).toBeDefined();
	});

	it("sr-only uses the clip pattern without display:none", () => {
		const r = single("fs-sr-only");
		expect(decl(r, "position")).toBe("absolute");
		expect(decl(r, "width")).toBe("1px");
		expect(decl(r, "height")).toBe("1px");
		expect(decl(r, "overflow")).toBe("hidden");
		expect(decl(r, "clip-path")).toBe("inset(50%)");
		expect(decl(r, "white-space")).toBe("nowrap");
		expect(decl(r, "display")).toBeUndefined();
		expect(
			r.declarations.some(
				(d) => d.value === "none" && d.property === "visibility",
			),
		).toBe(false);
	});

	it("sr-only-focusable reveals on :focus-visible", () => {
		const r = util.find((r) =>
			r.selectors.includes(".fs-sr-only-focusable:focus-visible"),
		);
		expect(r).toBeDefined();
		expect(decl(r as Rule, "clip-path")).toBe("none");
		expect(decl(r as Rule, "position")).toBe("static");
	});

	it("containers use the width tokens and a gutter", () => {
		for (const [name, token] of [
			["fs-container", "content"],
			["fs-container-narrow", "narrow"],
			["fs-container-wide", "wide"],
		] as const) {
			const r = single(name);
			expect(nows(decl(r, "width")), name).toBe(
				nows(
					`min(100% - 2 * var(--fs-gutter, var(--fs-space-6)), var(--fs-width-${token}))`,
				),
			);
			expect(decl(r, "margin-inline")).toBe("auto");
		}
		const m = util.find((r) => r.media?.includes("640px"));
		expect(m?.selectors.map(norm)).toEqual([
			".fs-container",
			".fs-container-narrow",
			".fs-container-wide",
		]);
		expect(decl(m as Rule, "--fs-gutter")).toBe("var(--fs-space-4)");
	});

	it("stack, cluster, measure", () => {
		expect(decl(single("fs-stack"), "flex-direction")).toBe("column");
		expect(nows(decl(single("fs-stack"), "gap"))).toBe(
			"var(--fs-stack-gap,var(--fs-space-4))",
		);
		expect(decl(single("fs-cluster"), "flex-wrap")).toBe("wrap");
		expect(decl(single("fs-cluster"), "align-items")).toBe("center");
		expect(nows(decl(single("fs-cluster"), "gap"))).toBe(
			"var(--fs-cluster-gap,var(--fs-space-3))",
		);
		expect(decl(single("fs-measure"), "max-width")).toBe("var(--fs-measure)");
	});

	it.each(["2xs", "xs", "sm", "md", "lg", "xl", "2xl", "display"])(
		"fs-text-%s sets size, line-height, tracking, weight",
		(s) => {
			const r = single(`fs-text-${s}`);
			expect(decl(r, "font-size")).toBe(`var(--fs-text-${s}-size)`);
			expect(decl(r, "line-height")).toBe(`var(--fs-text-${s}-line-height)`);
			expect(decl(r, "letter-spacing")).toBe(`var(--fs-text-${s}-tracking)`);
			expect(decl(r, "font-weight")).toBe(`var(--fs-text-${s}-weight)`);
		},
	);

	it.each(["2xs", "xs", "xl", "2xl", "display"])(
		"fs-text-%s is uppercase display",
		(s) => {
			const r = single(`fs-text-${s}`);
			expect(decl(r, "text-transform")).toBe("uppercase");
			expect(decl(r, "font-family")).toBe("var(--fs-font-display)");
			expect(decl(r, "font-stretch")).toBe("var(--fs-font-display-stretch)");
		},
	);

	it.each(["sm", "md", "lg"])("fs-text-%s is not uppercase display", (s) => {
		const r = single(`fs-text-${s}`);
		expect(decl(r, "text-transform")).toBeUndefined();
		expect(decl(r, "font-family")).toBeUndefined();
	});

	it("label = xs + muted color", () => {
		const label = single("fs-label");
		const xs = single("fs-text-xs");
		for (const d of xs.declarations)
			expect(decl(label, d.property), d.property).toBe(d.value);
		expect(decl(label, "color")).toBe("var(--fs-text-muted)");
	});

	it("font, numeric and color helpers", () => {
		expect(decl(single("fs-mono"), "font-family")).toBe("var(--fs-font-mono)");
		expect(decl(single("fs-mono"), "font-stretch")).toBe(
			"var(--fs-font-mono-stretch)",
		);
		expect(decl(single("fs-display"), "font-family")).toBe(
			"var(--fs-font-display)",
		);
		expect(decl(single("fs-tabular"), "font-variant-numeric")).toBe(
			"tabular-nums slashed-zero",
		);
		expect(decl(single("fs-muted"), "color")).toBe("var(--fs-text-muted)");
		expect(decl(single("fs-subtle"), "color")).toBe("var(--fs-text-subtle)");
	});
});
