import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const DEFAULT_DIR = join(
	dirname(fileURLToPath(import.meta.url)),
	"..",
	"tokens",
);

const isToken = (node) =>
	node !== null && typeof node === "object" && "$value" in node;

async function listFiles(dir) {
	const entries = await readdir(dir, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) files.push(...(await listFiles(full)));
		else if (entry.name.endsWith(".tokens.json")) files.push(full);
	}
	return files.sort();
}

function merge(target, source, path = []) {
	for (const [key, value] of Object.entries(source)) {
		const here = [...path, key];
		if (key.startsWith("$") && !isToken(source)) {
			// group-level metadata ($type, $description)
			if (key in target && target[key] !== value) {
				throw new Error(`Conflicting group ${key} at ${path.join(".")}`);
			}
			target[key] = value;
		} else if (isToken(value)) {
			if (key in target) {
				throw new Error(`Duplicate token path: ${here.join(".")}`);
			}
			target[key] = value;
		} else if (value !== null && typeof value === "object") {
			if (key in target && isToken(target[key])) {
				throw new Error(`Duplicate token path: ${here.join(".")}`);
			}
			target[key] ??= {};
			merge(target[key], value, here);
		} else {
			target[key] = value;
		}
	}
	return target;
}

/** Merge every *.tokens.json under `dir`; throws on a duplicate token path. */
export async function readTokens(dir = DEFAULT_DIR) {
	const tree = {};
	for (const file of await listFiles(dir)) {
		merge(tree, JSON.parse(await readFile(file, "utf8")));
	}
	return tree;
}

/** Flatten a DTCG tree to Map<"a.b.c", {$type,$value,$extensions?}>; $type is inherited from groups. */
export function flatten(tree) {
	const out = new Map();
	const walk = (node, path, inheritedType) => {
		const type = node.$type ?? inheritedType;
		for (const [key, value] of Object.entries(node)) {
			if (key.startsWith("$")) continue;
			const here = [...path, key];
			if (isToken(value)) {
				const token = { $type: value.$type ?? type, $value: value.$value };
				if (value.$extensions) token.$extensions = value.$extensions;
				out.set(here.join("."), token);
			} else if (value !== null && typeof value === "object") {
				walk(value, here, type);
			}
		}
	};
	walk(tree, [], undefined);
	return out;
}
