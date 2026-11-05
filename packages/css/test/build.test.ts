import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildCss } from "../scripts/build.mjs";

const ORDER =
	"@layer fs.reset, fs.tokens, fs.base, fs.components, fs.utilities, fs.effects;";
const LAYERS = ["reset", "base", "utilities", "effects"] as const;

let outDir: string;
const read = (name: string) => readFile(join(outDir, name), "utf8");
const stripComments = (css: string) =>
	css.replace(/\/\*[\s\S]*?\*\//g, "").trim();

beforeAll(async () => {
	outDir = await mkdtemp(join(tmpdir(), "fs-css-"));
	await buildCss({ outDir });
});
afterAll(() => rm(outDir, { recursive: true, force: true }));

describe("buildCss", () => {
	it("fs.css starts with the layer order", async () => {
		expect(stripComments(await read("fs.css")).startsWith(ORDER)).toBe(true);
	});

	it("fs.css inlines the tokens", async () => {
		const css = await read("fs.css");
		expect(css).toContain("--fs-bg:");
		expect(css).toContain('[data-fs-theme="night"]');
		expect(css).not.toContain("@import");
	});

	it.each(LAYERS)("per-layer file %s is standalone", async (name) => {
		const css = await read(`${name}.css`);
		expect(stripComments(css).startsWith(ORDER)).toBe(true);
		expect(css).not.toContain("--fs-bg:");
		const own = css.match(new RegExp(`@layer fs\\.${name}\\s*[{;]`, "g")) ?? [];
		expect(own).toHaveLength(1);
		for (const other of [...LAYERS, "tokens", "components"].filter(
			(l) => l !== name,
		)) {
			expect(css).not.toMatch(new RegExp(`@layer fs\\.${other}\\s*[{;]`));
		}
	});

	it("colors are not lowered", async () => {
		const out = await mkdtemp(join(tmpdir(), "fs-css-fx-"));
		try {
			const entry = fileURLToPath(
				new URL("./fixtures/colors.css", import.meta.url),
			);
			await buildCss({ outDir: out, entry });
			const css = await readFile(join(out, "fs.css"), "utf8");
			expect(css).toContain("oklch(");
			expect(css).toContain("color-mix(");
		} finally {
			await rm(out, { recursive: true, force: true });
		}
	});

	it("types file exists", async () => {
		expect(await read("css.d.mts")).toBe("export {};\n");
	});
});
