# @fs0lab/tokens

fs0ciety design tokens (W3C DTCG) as CSS variables, a typed JS module, a Tailwind v4 theme and Figma JSON.

## Install

```bash
pnpm add @fs0lab/tokens
```

## Entry points

| Import                              | Content                                                                             |
| ----------------------------------- | ----------------------------------------------------------------------------------- |
| `@fs0lab/tokens`                    | JS/TS: `themeNames`, `themes`, `tokens`, `cssVar(name)` (no side effects, SSR-safe) |
| `@fs0lab/tokens/css`                | CSS variables (`--fs-*`) for the three themes, inside `@layer fs.tokens`            |
| `@fs0lab/tokens/tailwind.css`       | Tailwind v4 `@theme` mapping; import it after `tokens.css`                          |
| `@fs0lab/tokens/figma/<theme>.json` | Figma variables JSON for `schematic`, `night`, `light`                              |
| `@fs0lab/tokens/tokens/...`         | Raw DTCG sources, e.g. `@fs0lab/tokens/tokens/themes/night.tokens.json`             |

## Themes

Set `data-fs-theme="schematic|night|light"` on `<html>` (or any ancestor). Without the attribute the theme is `schematic`, or `light` when the OS reports `prefers-color-scheme: light`.

## Example

```css
@import "@fs0lab/tokens/css";
@import "tailwindcss";
@import "@fs0lab/tokens/tailwind.css";

body {
	background: var(--fs-bg);
	color: var(--fs-text);
	font-family: var(--fs-font-sans);
}
```

```ts
import { cssVar, themeNames } from "@fs0lab/tokens";

document.documentElement.dataset.fsTheme = themeNames[1]; // "night"
const accent = cssVar("accent"); // "var(--fs-accent)"
```
