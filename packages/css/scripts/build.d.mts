export interface BuildCssOptions {
	outDir?: string;
	entry?: string;
}

export function buildCss(
	options?: BuildCssOptions,
): Promise<{ files: string[] }>;
