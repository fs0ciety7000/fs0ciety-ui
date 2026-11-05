# @fs0lab/css

fs0ciety CSS: reset, base styles, utility classes and CSS-only signature effects, in cascade layers. Built on `@fs0lab/tokens`.

## Install

```bash
pnpm add @fs0lab/css
```

## Usage

```ts
import "@fs0lab/css";
```

This single entry includes the tokens (`@fs0lab/tokens/css`), reset, base, utilities and effects.

To pick layers, import the per-layer files instead. You must then import the tokens yourself. `@fs0lab/tokens/css` has no layer order statement, so import one fs layer file (or your own order statement) before it:

```ts
import "@fs0lab/css/reset.css"; // declares the layer order first
import "@fs0lab/tokens/css";
import "@fs0lab/css/base.css";
import "@fs0lab/css/utilities.css";
import "@fs0lab/css/effects.css";
```

## Layers and overrides

Every `@fs0lab/css` file declares the order first (`@fs0lab/tokens/css` does not):

```css
@layer fs.reset, fs.tokens, fs.base, fs.components, fs.utilities, fs.effects;
```

Your unlayered CSS always wins over these layers, whatever its specificity. Reset and base element rules are wrapped in `:where()` (zero specificity), so a plain selector overrides them.

## Using with Tailwind CSS v4

Cascade-layer order is set by the first declaration of each layer name, so declare a combined order before importing either library, for example in the app's main CSS:

```css
@layer theme,
	base,
	fs.reset,
	fs.tokens,
	fs.base,
	fs.components,
	components,
	fs.utilities,
	utilities,
	fs.effects;
@import "tailwindcss";
@import "@fs0lab/css";
@import "@fs0lab/tokens/tailwind.css";
```

Consequences: Tailwind preflight (`base`) runs before the fs reset and base; fs base runs before Tailwind utilities; Tailwind utilities beat `fs.utilities`; `fs.effects` stays last. Later `@layer` statements (including the ones in each library) do not reorder layers already declared.

Alternative: skip Tailwind preflight (and drop `base` from the order) by importing only its theme and utilities (`@import "tailwindcss/theme.css" layer(theme);` and `@import "tailwindcss/utilities.css" layer(utilities);`) and let the fs reset do the job.

## Themes

Set `data-fs-theme="schematic|night|light"` on `<html>` for a page-wide theme (on `<body>` the canvas keeps the root theme), and on nested containers for local themes. Without it the theme is `schematic`, or `light` when the OS reports `prefers-color-scheme: light`.

`data-fs-theme` paints its own surface (background and text color). Put it on containers, not on inline decorations.

## Utilities

| Class                                                 | Effect                                                               |
| ----------------------------------------------------- | -------------------------------------------------------------------- |
| `.fs-sr-only`                                         | Visually hidden, still read by assistive tech                        |
| `.fs-sr-only-focusable`                               | Same, but visible on `:focus-visible` (skip links)                   |
| `.fs-container`, `-narrow`, `-wide`                   | Centered column (content, narrow, wide width) with gutters           |
| `.fs-stack`                                           | Vertical flex, gap `--fs-stack-gap` (default `--fs-space-4`)         |
| `.fs-cluster`                                         | Wrapping horizontal flex, gap `--fs-cluster-gap`                     |
| `.fs-measure`                                         | Limits line length to `--fs-measure`                                 |
| `.fs-text-2xs` ... `.fs-text-2xl`, `.fs-text-display` | Type scale (small and large steps use the display font)              |
| `.fs-label`                                           | Small uppercase muted label                                          |
| `.fs-mono`, `.fs-display`, `.fs-tabular`              | Font family and tabular numerals                                     |
| `.fs-muted`, `.fs-subtle`                             | Secondary text colors (`.fs-subtle` only for text of 12px and above) |

## Effects

Effects are CSS-only, enabled with `data-fs-fx` (space-separated values).

| Value          | What it does                                       | Reduced motion     | `prefers-contrast: more` | `forced-colors` |
| -------------- | -------------------------------------------------- | ------------------ | ------------------------ | --------------- |
| `scan`         | CRT scanlines over the host background             | unchanged (static) | off                      | off             |
| `sweep`        | Light band travelling top to bottom                | off                | off                      | off             |
| `bleed`        | Chromatic text-shadow split with occasional jitter | no animation       | off                      | off             |
| `grid`         | 8px minor and 64px major grid lines                | unchanged (static) | off                      | off             |
| `glitch-hover` | Offset and colored shadow on hover and focus       | no movement        | off                      | off             |
| `.fs-cursor`   | Blinking caret block (a class, not an attribute)   | steady, no blink   | unchanged                | `CanvasText`    |

Notes:

- `.fs-cursor` is decorative: add `aria-hidden="true"`.
- Scanlines and sweep paint behind content, above the host's own background. Put `data-fs-fx` on the element that owns the background; an opaque child hides them.
- Scanlines and sweep are off in the light theme. A dark theme nested inside a light one also loses them (known limitation).
- `data-fs-motion="paused"` on an element (or an ancestor) pauses `bleed`, `sweep` and `.fs-cursor`.

```html
<h1 data-fs-fx="scan bleed">fs0ciety</h1>
<span class="fs-cursor" aria-hidden="true"></span>
<section data-fs-motion="paused">...</section>
```

## Tests

Unit tests: `pnpm --filter @fs0lab/css test`. Visual tests run with `pnpm --filter @fs0lab/css test:e2e:docker`. `test:e2e` outside Docker fails the visual snapshots; snapshots are generated in the Playwright container, so they match across machines.
