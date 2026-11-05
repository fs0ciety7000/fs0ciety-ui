import { THEMES } from "./load.mjs";

const trim = (n) => String(Number(n.toFixed(4)));

export function formatColor({ components: [l, c, h], alpha }) {
	const hue = Number.isFinite(h) ? Math.round(h) % 360 : 0;
	const body = `${(l * 100).toFixed(1)}% ${c.toFixed(3)} ${hue}`;
	return alpha === undefined || alpha === 1
		? `oklch(${body})`
		: `oklch(${body} / ${trim(alpha)})`;
}

const dimension = ({ value, unit }) => `${value}${unit}`;

const family = (name) => (/\s/.test(name) ? `"${name}"` : name);

/** Convert one resolved DTCG value to its CSS text. */
export function formatValue(token) {
	const { $type: type, $value: value } = token;
	if (token.$extensions?.["fs0.raw"] === true) return String(value);
	switch (type) {
		case "color":
			return formatColor(value);
		case "dimension":
		case "duration":
			return typeof value === "string" ? value : dimension(value);
		case "cubicBezier":
			return `cubic-bezier(${value.join(", ")})`;
		case "fontFamily":
			return Array.isArray(value) ? value.map(family).join(", ") : value;
		case "shadow": {
			const { offsetX, offsetY, blur, spread, color } = value;
			return [
				dimension(offsetX),
				dimension(offsetY),
				dimension(blur),
				dimension(spread),
				formatColor(color),
			].join(" ");
		}
		default:
			return String(value);
	}
}

/** Custom property name from a token path (see naming rules in the plan). */
export function cssName(path) {
	if (path[0] === "theme") {
		const rest = path.slice(2);
		if (rest[0] === "color") rest.shift();
		if (rest[0] === "shadow") rest.shift();
		return `--fs-${rest.join("-")}`;
	}
	return `--fs-${path.join("-")}`;
}

/** Style Dictionary 5 transform: sets token.name to the CSS custom property name. */
export const kebabTransform = {
	name: "name/fs-kebab",
	type: "name",
	transform: (token) => cssName(token.path),
};

function declaration(token) {
	const alias = token.original?.$value;
	const aliasMatch =
		typeof alias === "string" ? /^\{([^{}]+)\}$/.exec(alias) : null;
	const css = aliasMatch
		? `var(${cssName(aliasMatch[1].split("."))})`
		: formatValue(token);
	if (css.includes("{")) {
		throw new Error(
			`Unresolved "{" in value of ${token.path.join(".")}: ${css}`,
		);
	}
	return `${token.name}: ${css};`;
}

const indent = (lines, depth) =>
	lines.map((line) => `${"\t".repeat(depth)}${line}`);

const rule = (selector, decls, depth) => [
	...indent([`${selector} {`], depth),
	...indent(decls, depth + 1),
	...indent(["}"], depth),
];

/** Style Dictionary format: all tokens as CSS custom properties in @layer fs.tokens. */
export function cssVarsFormat({ dictionary }) {
	const base = [];
	const themes = Object.fromEntries(THEMES.map((t) => [t, []]));
	for (const token of dictionary.allTokens) {
		if (token.path[0] === "theme") {
			const bucket = themes[token.path[1]];
			if (!bucket) throw new Error(`Unknown theme ${token.path[1]}`);
			bucket.push(declaration(token));
		} else {
			base.push(declaration(token));
		}
	}
	const out = [
		"@layer fs.tokens {",
		...rule(":root", base, 1),
		...rule(':root, [data-fs-theme="schematic"]', themes.schematic, 1),
		...rule('[data-fs-theme="night"]', themes.night, 1),
		...rule('[data-fs-theme="light"]', themes.light, 1),
		"\t@media (prefers-color-scheme: light) {",
		...rule(":root:not([data-fs-theme])", themes.light, 2),
		"\t}",
		"}",
	];
	return `${out.join("\n")}\n`;
}
