import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { buildTokens } from "../scripts/build.mjs";

let outDir: string;
beforeAll(async () => {
	outDir = await mkdtemp(join(tmpdir(), "fs-tokens-extra-"));
	await buildTokens({ outDir });
});

describe("tailwind.css", () => {
	it("tailwind theme maps roles", async () => {
		const css = await readFile(join(outDir, "tailwind.css"), "utf8");
		expect(css).toContain("@theme inline");
		expect(css).toContain("--color-fs-accent: var(--fs-accent);");
		expect(css).toContain("--radius-fs-md: var(--fs-radius-md);");
		expect(css).toContain("--font-sans: var(--fs-font-sans);");
		expect(css).toContain("--spacing: 4px;");
	});
});

describe("figma json", () => {
	it("figma json resolved", async () => {
		const text = await readFile(join(outDir, "figma", "night.json"), "utf8");
		expect(text).not.toContain("{color.");
		const json = JSON.parse(text);
		expect(json.color.accent.$value.hex).toBe("#3DDC6B");
		expect(json.color.backdrop.$value.alpha).toBe(0.72);
		expect(json.radius.md.$value).toEqual({ value: 4, unit: "px" });
		expect(json.shadow.glow.$type).toBe("shadow");
		expect(json.icon.cap.$value).toBe("round");
		expect(json.primitive.color.blue["500"].$value.hex).toBe("#5B8CFF");
		expect(JSON.stringify(json)).not.toMatch(/"\{/);
	});
});
