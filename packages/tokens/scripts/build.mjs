import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import StyleDictionary from "style-dictionary";
import {
	cssVarsFormat,
	figmaFormat,
	kebabTransform,
	tailwindFormat,
	tsFormat,
} from "./formats.mjs";
import { DEFAULT_DIR, flatten, readTokens, resolve, THEMES } from "./load.mjs";

const PKG_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Build every output format. `tokensDir` and `outDir` are overridable for tests. */
export async function buildTokens({
	outDir = join(PKG_DIR, "dist"),
	tokensDir = DEFAULT_DIR,
} = {}) {
	// tsdown runs with clean: false, so drop stale CSS output ourselves.
	const isDefault = outDir === join(PKG_DIR, "dist");
	if (isDefault) {
		for (const stale of ["css", "figma", "tailwind.css"]) {
			await rm(join(outDir, stale), { recursive: true, force: true });
		}
	}
	const tree = await readTokens(tokensDir);
	// Validate aliases first so errors carry our message, not Style Dictionary's.
	const resolved = resolve(flatten(tree));

	const sd = new StyleDictionary({
		tokens: tree,
		log: { verbosity: "silent" },
		hooks: {
			transforms: { "name/fs-kebab": kebabTransform },
			formats: { "css/fs-vars": cssVarsFormat },
		},
		platforms: {
			css: {
				transforms: ["name/fs-kebab"],
				buildPath: `${outDir}/css/`,
				files: [{ destination: "tokens.css", format: "css/fs-vars" }],
			},
		},
	});
	await sd.buildAllPlatforms();

	// The TS module lives in the package src only for the real build.
	const generatedDir = isDefault
		? join(PKG_DIR, "src", "generated")
		: join(outDir, "generated");
	await mkdir(generatedDir, { recursive: true });
	await writeFile(join(generatedDir, "tokens.ts"), tsFormat(resolved));
	await writeFile(join(outDir, "tailwind.css"), tailwindFormat(resolved));
	await mkdir(join(outDir, "figma"), { recursive: true });
	for (const theme of THEMES) {
		await writeFile(
			join(outDir, "figma", `${theme}.json`),
			figmaFormat(resolved, theme),
		);
	}
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	await buildTokens();
}
