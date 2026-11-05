import { readFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { transform } from "lightningcss";

/* Shared CSS parsing helpers. Everything goes through lightningcss; values and
 * selectors are re-serialised by lightningcss itself, never matched on raw text. */

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export type Decl = { property: string; value: string; important: boolean };
export type Rule = {
	/** Serialised selectors, one per comma-separated selector. */
	selectors: string[];
	/** Selector ASTs (lightningcss components), parallel to `selectors`. */
	selectorAsts: Component[][];
	declarations: Decl[];
	/** Raw declaration ASTs (lightningcss), parallel to `declarations`. */
	declarationAsts: unknown[];
	/** Enclosing @media condition (without "@media"), if any. */
	media?: string | undefined;
	/** Enclosing @layer name, if any. */
	layer?: string | undefined;
};
export type Component = { type: string; [key: string]: unknown };

// biome-ignore lint/suspicious/noExplicitAny: lightningcss AST nodes are untyped here.
type Any = any;

const STUB = ".s{color:red}";

/** Serialise AST pieces back to text by letting lightningcss print a stub rule. */
function print(
	selectors: Component[][] | undefined,
	declarations: unknown[] | undefined,
	stubDecl: unknown,
): string {
	let done = false;
	const { code } = transform({
		filename: "stub.css",
		code: Buffer.from(STUB),
		minify: true,
		visitor: {
			Rule: {
				style(rule: Any) {
					if (done) return undefined;
					done = true;
					return {
						type: "style",
						value: {
							...rule.value,
							selectors: selectors ?? rule.value.selectors,
							declarations: {
								declarations: declarations ?? [stubDecl],
								importantDeclarations: [],
							},
						},
					};
				},
			},
		},
	});
	return code.toString();
}

let stubDeclCache: unknown;
function stubDecl(): unknown {
	if (!stubDeclCache) {
		transform({
			filename: "stub.css",
			code: Buffer.from(STUB),
			visitor: {
				Declaration: {
					color(d: Any) {
						stubDeclCache = d;
					},
				},
			},
		});
	}
	return stubDeclCache;
}

/** Drop `from: null` and `fallback: null` (serialisation artefacts lightningcss cannot read back). */
function clean<T>(node: T): T {
	return JSON.parse(JSON.stringify(node), (key, value) =>
		(key === "from" || key === "fallback") && value === null
			? undefined
			: value,
	);
}

function inner(printed: string): string {
	return printed.slice(printed.indexOf("{") + 1, printed.lastIndexOf("}"));
}

export function printSelector(selector: Component[]): string {
	const out = print([selector], undefined, stubDecl());
	return out.slice(0, out.lastIndexOf("{"));
}

export function printValue(declaration: unknown): string {
	const text = inner(
		print([[{ type: "class", name: "s" }]], [clean(declaration)], null),
	);
	return text.slice(text.indexOf(":") + 1).trim();
}

function declName(declaration: unknown): string {
	const d = declaration as Any;
	if (d.property === "custom") return d.value.name;
	if (d.property === "unparsed") return d.value.propertyId.property;
	return d.property;
}

function printMedia(query: unknown): string {
	let done = false;
	const { code } = transform({
		filename: "stub.css",
		code: Buffer.from(STUB),
		minify: true,
		visitor: {
			Rule: {
				style(rule: Any): Any {
					if (done) return undefined;
					done = true;
					return {
						type: "media",
						value: { query, rules: [rule], loc: rule.value.loc },
					};
				},
			},
		},
	});
	const s = code.toString();
	return s.slice("@media ".length, s.indexOf("{"));
}

/** Parse CSS text into a flat list of style rules with their @media/@layer context. */
export function parseCss(code: string, filename = "input.css"): Rule[] {
	// Collect raw ASTs first: lightningcss cannot be re-entered from a visitor,
	// so serialisation happens after the walk.
	type Raw = { value: Any; query?: unknown; layer?: string | undefined };
	const raws: Raw[] = [];
	// The visitor hands out fresh objects for nested rules, so dedupe by source position.
	const seen = new Set<string>();

	const walk = (
		rule: Any,
		query?: unknown,
		layer?: string | undefined,
	): void => {
		switch (rule.type) {
			case "style": {
				const key = `${rule.value.loc?.line}:${rule.value.loc?.column}`;
				if (seen.has(key)) break;
				seen.add(key);
				raws.push({ value: rule.value, query, layer });
				for (const nested of rule.value.rules ?? []) walk(nested, query, layer);
				break;
			}
			case "media":
				for (const r of rule.value.rules) walk(r, rule.value.query, layer);
				break;
			case "layer-block":
				for (const r of rule.value.rules)
					walk(r, query, rule.value.name?.join("."));
				break;
			default:
				break;
		}
	};

	transform({
		filename,
		code: Buffer.from(code),
		visitor: {
			Rule(rule: Any) {
				walk(rule);
				return undefined;
			},
		},
	});

	return raws.map(({ value: v, query, layer }) => {
		const decls = [
			...v.declarations.declarations.map((d: unknown) => [d, false]),
			...v.declarations.importantDeclarations.map((d: unknown) => [d, true]),
		] as [unknown, boolean][];
		return {
			selectors: v.selectors.map(printSelector),
			selectorAsts: v.selectors,
			declarations: decls.map(([d, important]) => ({
				property: declName(d),
				value: printValue(d),
				important,
			})),
			declarationAsts: decls.map(([d]) => d),
			media: query === undefined ? undefined : printMedia(query),
			layer,
		};
	});
}

/** Rules of `src/<name>.css` (or any absolute / package-relative path). */
export function rulesOf(file: string): Rule[] {
	const path = isAbsolute(file)
		? file
		: file.includes("/")
			? join(root, file)
			: join(root, "src", file.endsWith(".css") ? file : `${file}.css`);
	return parseCss(readFileSync(path, "utf8"), path);
}

/**
 * True when every component is :where(...) or a combinator. A trailing
 * pseudo-element is tolerated: it cannot live inside :where() (invalid), so
 * `:where(*)::before` is the lowest specificity achievable for it.
 */
export function isZeroSpecificity(selector: Component[]): boolean {
	return selector.every(
		(c) =>
			c.type === "combinator" ||
			c.type === "pseudo-element" ||
			(c.type === "pseudo-class" && c.kind === "where"),
	);
}

const COLOR_SPACES = new Set([
	"rgb",
	"srgb",
	"hsl",
	"hwb",
	"lab",
	"lch",
	"oklab",
	"oklch",
	"predefined",
	"xyz",
]);
const COLOR_FUNCTIONS = new Set([
	"rgb",
	"rgba",
	"hsl",
	"hsla",
	"hwb",
	"lab",
	"lch",
	"oklab",
	"oklch",
	"color",
]);
export const ALLOWED_COLOR_IDENTS = new Set(
	[
		"Canvas",
		"CanvasText",
		"Highlight",
		"HighlightText",
		"LinkText",
		"ButtonText",
		"ButtonFace",
		"GrayText",
		"Field",
		"FieldText",
		"Mark",
		"MarkText",
		"AccentColor",
		"AccentColorText",
		"VisitedText",
		"SelectedItem",
		"SelectedItemText",
		"inherit",
		"initial",
		"unset",
		"currentColor",
		"transparent",
	].map((s) => s.toLowerCase()),
);
const NAMED_COLORS = new Set(
	`aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen`.split(
		/\s+/,
	),
);

/** Reasons a declaration breaks the "semantic tokens only, no literal colors" rule. */
export function colorViolations(declaration: unknown): string[] {
	const found: string[] = [];
	const visit = (node: Any): void => {
		if (Array.isArray(node)) {
			for (const item of node) visit(item);
			return;
		}
		if (node === null || typeof node !== "object") return;
		if (typeof node.type === "string") {
			if (COLOR_SPACES.has(node.type)) {
				const transparent =
					node.type === "rgb" &&
					node.alpha === 0 &&
					!node.r &&
					!node.g &&
					!node.b;
				if (!transparent) found.push(`literal color (${node.type})`);
			}
			if (node.type === "hash" || node.type === "id-hash")
				found.push(`hex color #${node.value}`);
			if (node.type === "ident" && typeof node.value === "string") {
				const v = node.value.toLowerCase();
				if (NAMED_COLORS.has(v) && !ALLOWED_COLOR_IDENTS.has(v))
					found.push(`named color ${node.value}`);
			}
		}
		if (
			typeof node.name === "string" &&
			COLOR_FUNCTIONS.has(node.name.toLowerCase()) &&
			Array.isArray(node.arguments)
		)
			found.push(`color function ${node.name}()`);
		if (node.ident?.startsWith?.("--fs-color-"))
			found.push(`primitive token ${node.ident}`);
		for (const value of Object.values(node)) visit(value);
	};
	visit(declaration);
	return [...new Set(found)];
}
