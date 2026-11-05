export function cssName(path: string[]): string;
export function formatColor(value: {
	components: [number, number, number];
	alpha?: number;
}): string;
export function formatValue(token: {
	$type?: string;
	$value: unknown;
	$extensions?: Record<string, unknown>;
}): string;
export const kebabTransform: unknown;
export function cssVarsFormat(args: {
	dictionary: { allTokens: unknown[] };
}): string;
