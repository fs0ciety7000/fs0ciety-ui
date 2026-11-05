import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { buildTokens } from "../scripts/build.mjs";

let css: string;
beforeAll(async () => {
	const outDir = await mkdtemp(join(tmpdir(), "fs-tokens-"));
	await buildTokens({ outDir });
	css = await readFile(join(outDir, "css", "tokens.css"), "utf8");
});

const block = (selector: string) => {
	const start = css.indexOf(`${selector} {`);
	if (start === -1) throw new Error(`missing block ${selector}`);
	return css.slice(start, css.indexOf("}", start));
};

describe("tokens.css", () => {
	it("wrapped in fs.tokens layer", () => {
		expect(css).toMatch(/^@layer fs\.tokens \{/);
		expect(css.trimEnd().endsWith("}")).toBe(true);
	});

	it("theme selectors match any element", () => {
		expect(css).toContain('[data-fs-theme="night"] {');
		expect(css).not.toMatch(/:root\s*\[data-fs-theme="night"\]/);
		expect(css).not.toMatch(/:root\[data-fs-theme="night"\]/);
	});

	it("OS light preference only without attribute", () => {
		const media = css.indexOf("@media (prefers-color-scheme: light)");
		expect(media).toBeGreaterThan(-1);
		expect(css.indexOf(":root:not([data-fs-theme])", media)).toBeGreaterThan(
			media,
		);
	});

	it("colors are oklch", () => {
		expect(css).toContain("--fs-color-ink-950: oklch(12.2% 0.006 262);");
		expect(css).not.toContain("#");
	});

	it("roles alias primitives", () => {
		expect(block(':root, [data-fs-theme="schematic"]')).toContain(
			"--fs-bg: var(--fs-color-ink-950);",
		);
	});

	it("alpha preserved", () => {
		expect(block(':root, [data-fs-theme="schematic"]')).toMatch(
			/--fs-backdrop: oklch\([^)]*\/ 0\.72\);/,
		);
	});

	it("raw values verbatim", () => {
		expect(css).toContain("--fs-text-display-size: clamp(56px, 8vw, 108px);");
		expect(css).toContain("--fs-ease-glitch: steps(1);");
	});

	it("formats dimensions, durations, easing, fonts and shadows", () => {
		expect(css).toContain("--fs-space-6: 24px;");
		expect(css).toContain("--fs-duration-moderate: 450ms;");
		expect(css).toContain(
			"--fs-ease-standard: cubic-bezier(0.165, 0.84, 0.44, 1);",
		);
		expect(css).toContain(
			'--fs-font-display: "fs0 Mono", "Martian Mono", ui-monospace, monospace;',
		);
		expect(css).toContain(
			"--fs-glow: 0px 0px 32px 0px oklch(80.7% 0.101 250 / 0.12);",
		);
		expect(css).toContain("--fs-text-md-line-height:");
		expect(css).toContain("--fs-icon-stroke-small:");
		expect(css).not.toMatch(/--fs-[\w-]+:[^;]*[{}]/);
	});

	it("broken alias fails the build", async () => {
		const outDir = await mkdtemp(join(tmpdir(), "fs-tokens-"));
		await expect(
			buildTokens({
				outDir,
				tokensDir: join(import.meta.dirname, "fixtures", "broken"),
			}),
		).rejects.toThrow(
			"Unknown alias {color.nope.1} in theme.schematic.color.bg",
		);
	});
});
