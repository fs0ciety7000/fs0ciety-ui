import type { ColorValue } from "./load.mjs";

export type Role =
	| "bg"
	| "surface"
	| "surface-raised"
	| "line"
	| "line-strong"
	| "text-strong"
	| "text"
	| "text-muted"
	| "text-subtle"
	| "link"
	| "link-hover"
	| "accent"
	| "on-accent"
	| "focus-ring"
	| "success"
	| "warning"
	| "danger"
	| "on-danger"
	| "info"
	| "cable-1"
	| "cable-2"
	| "cable-3"
	| "backdrop";

export type ContrastRule = { fg: Role; bg: Role[]; min: number };

export const CONTRAST_RULES: ContrastRule[];
export function wcagRatio(fg: ColorValue, bg: ColorValue): number;
export function apcaLc(fg: ColorValue, bg: ColorValue): number;
