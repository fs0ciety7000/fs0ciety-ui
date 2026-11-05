export type ColorValue = {
	colorSpace: "oklch";
	components: [number, number, number];
	alpha?: number;
	hex: string;
};
export type Token = {
	$type?: string;
	$value: unknown;
	$extensions?: Record<string, unknown>;
};
export type TokenTree = {
	[key: string]: TokenTree | Token | string | undefined;
};
export const DEFAULT_DIR: string;
export function readTokens(dir?: string): Promise<TokenTree>;
export function flatten(tree: TokenTree): Map<string, Token>;
