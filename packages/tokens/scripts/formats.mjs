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
export function formatValue(token, path = token.path?.join(".")) {
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
			if (typeof value !== "object" || value === null || Array.isArray(value))
				throw new Error(`Unsupported shadow value in ${path}`);
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
			if (typeof value === "object" && value !== null)
				throw new Error(`Unsupported ${type} value in ${path}`);
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

/** Role names, taken from the schematic theme (the reference set). */
export function roleNames(resolved) {
	const roles = [];
	for (const path of resolved.keys()) {
		const parts = path.split(".");
		if (
			parts[0] === "theme" &&
			parts[1] === "schematic" &&
			parts[2] === "color"
		)
			roles.push(parts.slice(3).join("."));
	}
	return roles;
}

function assertResolved(text, where) {
	if (text.includes("{")) {
		throw new Error(`Unresolved "{" in ${where}`);
	}
}

/** Nested tree of CSS-form strings from the resolved token map. */
function nestedCss(resolved) {
	const root = {};
	for (const [path, token] of resolved) {
		const css = formatValue(token, path);
		assertResolved(css, path);
		const parts = path.split(".");
		let node = root;
		for (const part of parts.slice(0, -1)) node = node[part] ??= {};
		node[parts.at(-1)] = css;
	}
	return root;
}

/** Source of `generated/tokens.ts` (themes, tokens, names, types). */
export function tsFormat(resolved) {
	const roles = roleNames(resolved);
	const themes = {};
	for (const theme of THEMES) {
		themes[theme] = {};
		for (const role of roles) {
			const token = resolved.get(`theme.${theme}.color.${role}`);
			if (!token) throw new Error(`Missing role ${role} in theme ${theme}`);
			themes[theme][role] = formatColor(token.$value);
		}
	}
	const json = (value) => JSON.stringify(value, null, "\t");
	return [
		"// Generated by scripts/build.mjs. Do not edit.",
		`export const themeNames = ${json(THEMES)} as const;`,
		"export type ThemeName = (typeof themeNames)[number];",
		`export const roleNames = ${json(roles)} as const;`,
		"export type Role = (typeof roleNames)[number];",
		`export const themes: Record<ThemeName, Record<Role, string>> = ${json(themes)};`,
		`export const tokens = ${json(nestedCss(resolved))} as const;`,
		"",
	].join("\n");
}

/** Tailwind v4 CSS-first theme that references the CSS variables. */
export function tailwindFormat(resolved) {
	const lines = ["@theme inline {"];
	for (const role of roleNames(resolved))
		lines.push(`\t--color-fs-${role}: var(--fs-${role});`);
	for (const size of ["sm", "md", "lg", "pill"])
		lines.push(`\t--radius-fs-${size}: var(--fs-radius-${size});`);
	for (const font of ["display", "sans", "mono"])
		lines.push(`\t--font-${font}: var(--fs-font-${font});`);
	lines.push("\t--spacing: 4px;", "}");
	return `${lines.join("\n")}\n`;
}

const dtcg = ({ $type, $value }) => ({ $type, $value });

/** Resolved DTCG JSON for one theme: its roles plus the color primitives. */
export function figmaFormat(resolved, theme) {
	const out = {
		color: {},
		radius: {},
		shadow: {},
		icon: {},
		primitive: { color: {} },
	};
	const prefix = `theme.${theme}.`;
	for (const [path, token] of resolved) {
		const parts = path.split(".");
		let target;
		if (path.startsWith(prefix)) {
			const [group, ...rest] = parts.slice(2);
			if (!(group in out) || group === "primitive") continue;
			out[group][rest.join(".")] = dtcg(token);
		} else if (parts[0] === "color") {
			const [hue, ...rest] = parts.slice(1);
			if (rest.length === 0) {
				out.primitive.color[hue] = dtcg(token);
			} else {
				target = out.primitive.color[hue] ??= {};
				target[rest.join(".")] = dtcg(token);
			}
		}
	}
	const text = JSON.stringify(out, null, "\t");
	if (/"\{[^"]*\}"/.test(text)) {
		throw new Error(`Unresolved alias in figma/${theme}.json`);
	}
	return `${text}\n`;
}
