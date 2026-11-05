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
export type ResolvedToken = Token & { aliasOf?: string };
export const THEMES: readonly ["schematic", "night", "light"];
export function resolve(map: Map<string, Token>): Map<string, ResolvedToken>;
