import { calcAPCA } from "apca-w3";
import { formatHex, parse, rgb } from "culori";

/** @typedef {import("./load.mjs").ColorValue} ColorValue */

/**
 * Convert a DTCG color value to sRGB (0-1). The `hex` field is authoritative; the
 * OKLCH components are only a fallback.
 */
function toRgb(color) {
	const parsed = color.hex
		? parse(color.hex)
		: {
				mode: "oklch",
				l: color.components[0],
				c: color.components[1],
				h: color.components[2],
			};
	const { r, g, b } = rgb(parsed);
	return { r, g, b };
}

function channel(v) {
	const c = Math.min(1, Math.max(0, v));
	return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance({ r, g, b }) {
	return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Composite fg (with its alpha) over an opaque bg. */
function composite(fg, bg) {
	const a = fg.alpha ?? 1;
	const f = toRgb(fg);
	const b = toRgb(bg);
	return {
		r: f.r * a + b.r * (1 - a),
		g: f.g * a + b.g * (1 - a),
		b: f.b * a + b.b * (1 - a),
	};
}

/** WCAG 2.x contrast ratio of fg over bg (fg alpha composited on bg). */
export function wcagRatio(fg, bg) {
	const l1 = luminance(composite(fg, bg));
	const l2 = luminance(toRgb(bg));
	const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
	return (hi + 0.05) / (lo + 0.05);
}

/** APCA lightness contrast (informative only). */
export function apcaLc(fg, bg) {
	return calcAPCA(formatHex(composite(fg, bg)), formatHex(toRgb(bg)));
}

const SURFACES = ["bg", "surface", "surface-raised"];

/** WCAG promises of DESIGN.md. Reused by the palette tool and the a11y docs page. */
export const CONTRAST_RULES = [
	{
		fg: "text",
		bg: SURFACES,
		min: 4.5,
	},
	{ fg: "text-strong", bg: SURFACES, min: 4.5 },
	{ fg: "text-muted", bg: SURFACES, min: 4.5 },
	{ fg: "text-subtle", bg: SURFACES, min: 4.5 },
	{ fg: "link", bg: SURFACES, min: 4.5 },
	{ fg: "link-hover", bg: SURFACES, min: 4.5 },
	{ fg: "info", bg: SURFACES, min: 4.5 },
	{ fg: "success", bg: SURFACES, min: 4.5 },
	{ fg: "warning", bg: SURFACES, min: 4.5 },
	{ fg: "danger", bg: SURFACES, min: 4.5 },
	{ fg: "accent", bg: SURFACES, min: 4.5 },
	{ fg: "on-accent", bg: ["accent"], min: 4.5 },
	{ fg: "on-danger", bg: ["danger"], min: 4.5 },
	{ fg: "line-strong", bg: SURFACES, min: 3 },
	{ fg: "focus-ring", bg: SURFACES, min: 3 },
];
