import type { Role } from "./generated/tokens";

export * from "./generated/tokens";

/** `var(--fs-<name>)` for a role or primitive (`color-<hue>-<step>`). */
export function cssVar(name: Role | `color-${string}` | (string & {})): string {
	return `var(--fs-${name})`;
}
