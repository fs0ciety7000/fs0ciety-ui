import { mkdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { browserslistToTargets, bundleAsync } from "lightningcss";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(join(root, "package.json"));

const LAYER_ORDER =
	"@layer fs.reset, fs.tokens, fs.base, fs.components, fs.utilities, fs.effects;";
const LAYERS = ["reset", "base", "utilities", "effects"];
const targets = browserslistToTargets([
	"chrome 120",
	"firefox 121",
	"safari 17.2",
]);

async function bundle(filename) {
	const { code } = await bundleAsync({
		filename,
		minify: false,
		targets,
		resolver: {
			resolve(specifier, from) {
				if (specifier.startsWith("@fs0lab/")) return require.resolve(specifier);
				return resolve(dirname(from), specifier);
			},
		},
	});
	return code.toString();
}

const withOrder = (css) =>
	css.trimStart().startsWith(LAYER_ORDER) ? css : `${LAYER_ORDER}\n\n${css}`;

/**
 * @param {{ outDir?: string, entry?: string }} [options]
 */
export async function buildCss({ outDir = join(root, "dist"), entry } = {}) {
	const out = {};
	out["fs.css"] = withOrder(await bundle(entry ?? join(root, "src/index.css")));
	if (!entry) {
		for (const name of LAYERS) {
			out[`${name}.css`] = withOrder(
				await bundle(join(root, `src/${name}.css`)),
			);
		}
	}
	out["css.d.mts"] = "export {};\n";

	await mkdir(outDir, { recursive: true });
	const files = [];
	for (const [name, content] of Object.entries(out)) {
		const file = join(outDir, name);
		await rm(file, { force: true });
		await writeFile(file, content);
		files.push(file);
	}
	return { files };
}

if (
	process.argv[1] &&
	resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	const { files } = await buildCss();
	console.log(`@fs0lab/css: wrote ${files.length} files`);
}
