export function cssName(path: string[]): string;
export function formatColor(value: {
	components: [number, number, number];
	alpha?: number;
}): string;
export function formatValue(
	token: {
		$type?: string;
		$value: unknown;
		$extensions?: Record<string, unknown>;
		path?: string[];
	},
	path?: string,
): string;
export const kebabTransform: unknown;
export function cssVarsFormat(args: {
	dictionary: { allTokens: unknown[] };
}): string;
type ResolvedMap = Map<string, { $type?: string; $value: unknown }>;
export function roleNames(resolved: ResolvedMap): string[];
export function tsFormat(resolved: ResolvedMap): string;
export function tailwindFormat(resolved: ResolvedMap): string;
export function figmaFormat(resolved: ResolvedMap, theme: string): string;
