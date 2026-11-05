import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import StyleDictionary from "style-dictionary";
import { cssVarsFormat, kebabTransform } from "./formats.mjs";
import { DEFAULT_DIR, flatten, readTokens, resolve } from "./load.mjs";

const PKG_DIR = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Build every output format. `tokensDir` and `outDir` are overridable for tests. */
export async function buildTokens({
	outDir = join(PKG_DIR, "dist"),
	tokensDir = DEFAULT_DIR,
} = {}) {
	const tree = await readTokens(tokensDir);
	// Validate aliases first so errors carry our message, not Style Dictionary's.
	resolve(flatten(tree));

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
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	await buildTokens();
}
