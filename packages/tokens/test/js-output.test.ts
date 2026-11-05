import { execFileSync } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { buildTokens } from "../scripts/build.mjs";

const PKG = join(dirname(fileURLToPath(import.meta.url)), "..");
let outDir: string;
let ts: string;

beforeAll(async () => {
	outDir = await mkdtemp(join(tmpdir(), "fs-tokens-js-"));
	await buildTokens({ outDir });
	// Real build: writes src/generated and dist/index.mjs for the SSR check.
	execFileSync("pnpm", ["build"], { cwd: PKG, stdio: "pipe" });
	ts = await readFile(join(outDir, "generated", "tokens.ts"), "utf8");
}, 120_000);

describe("generated tokens module", () => {
	it("themes map is complete and oklch", async () => {
		const { roleNames, themes, themeNames } = await import(
			join(outDir, "generated", "tokens.ts")
		);
		expect(themeNames).toEqual(["schematic", "night", "light"]);
		expect(roleNames).toHaveLength(23);
		for (const theme of themeNames)
			for (const role of roleNames)
				expect(themes[theme][role]).toMatch(/^oklch\(/);
		expect(themes.night.accent).toBe("oklch(78.9% 0.202 149)");
		expect(themes.night.backdrop).toContain("/ 0.72");
	});

	it("tokens tree is resolved, no aliases", () => {
		expect(ts).toContain("as const;");
		expect(ts).not.toContain("{color.");
	});

	it("cssVar", async () => {
		const { cssVar } = await import("../src/index");
		expect(cssVar("bg")).toBe("var(--fs-bg)");
		expect(cssVar("color-ink-950")).toBe("var(--fs-color-ink-950)");
	});

	it("SSR-safe import", () => {
		const out = execFileSync(
			process.execPath,
			[
				"--input-type=module",
				"-e",
				"import('@fs0lab/tokens').then(m => console.log(m.themeNames.length))",
			],
			{ cwd: PKG, encoding: "utf8" },
		);
		expect(out.trim()).toBe("3");
	});
});
