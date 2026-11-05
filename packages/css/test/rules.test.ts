import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
	colorViolations,
	isZeroSpecificity,
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
	const EXEMPT = new Set([
		":focus-visible",
		":focus:not(:focus-visible)",
		"::selection",
	]);
	const exempt = (selector: string) =>
		EXEMPT.has(norm(selector)) ||
		selector.startsWith(":root") ||
		selector.startsWith("[data-fs-theme");

	it("reset and base element selectors have zero specificity", () => {
		const offenders: string[] = [];
		for (const file of ["reset", "base"]) {
			for (const rule of rulesOf(file)) {
				rule.selectorAsts.forEach((ast, i) => {
					const text = rule.selectors[i] ?? "";
					if (!isZeroSpecificity(ast) && !exempt(text))
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
