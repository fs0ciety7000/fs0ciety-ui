# Brief du projet

> Rempli en phase 1 de `/new-project`. Court : une page.

## Objectif

**fs0ciety** : design system premium, moderne et « tech », dérivé de l'univers fs0ciety, réutilisable dans tous mes projets. Il est publié sur npm sous le scope `@fs0lab`, avec une documentation vitrine qui sert aussi de pièce de portfolio.

## Public

- Moi d'abord : mes futurs projets en Svelte/SvelteKit, React/Next.js et Astro.
- Les développeurs qui découvrent le système via npm ou la doc (licence MIT).
- Les visiteurs du portfolio : la doc doit impressionner autant qu'elle informe.

## Direction visuelle

- **Défaut, D « Schematic Bleed »** ([maquettes](https://claude.ai/artifact/R4zgHUaqT31R7Dcpe6TmQ8)) : fond noir, traits de plan bleu glacier en filet de 1 px avec repères d'angle et cotes, câbles corail, bleu et orange utilisés comme signaux, décalage chromatique RVB, scanlines. Titres en Martian Mono condensée majuscules, texte en Inter Tight.
- **E « Night Shift »**, pour les dashboards : indigo, pluie de données, vert phosphore.
- **Thème clair**.
- Tokens de départ : void `#050608`, trace `#8EC5FF`, câble `#5B8CFF`, corail `#FF4F7B`, braise `#FF9A3C`, phosphore `#DCE8F7`, muted `#7F93AD` · night `#070A1F`, matrix `#3B55E6`, vivant `#3DDC6B`, lavande `#B9A8FF`.

## Indispensable (v1)

1. **Fondations** : `@fs0lab/tokens` au format W3C DTCG, couleurs en OKLCH (sortie en CSS vars, JS/TS, preset Tailwind et JSON Figma ; thèmes schematic, night et light) et `@fs0lab/css` (reset, base, utilitaires, effets CSS seuls, respect de reduced-motion).
2. **Composants** : environ 18 composants (Button, IconButton, Input, Textarea, Select, Checkbox, Switch, Badge, Card, Frame, Window, Terminal, Readout, Tabs, Dialog, Toast, Tooltip, Table, Kbd, CodeBlock) avec la même API dans `@fs0lab/svelte` (Svelte 5, **livré en premier**), `@fs0lab/react` (React 19, compatible RSC) et `@fs0lab/astro`.
3. **Motion** : `@fs0lab/motion`, avec GSAP en peer dependency, les presets fs-draw, fs-scramble, fs-boot, fs-glitch et fs-count, et des adaptateurs Svelte, React et Astro. Sous reduced-motion, seuls les états finaux s'affichent. Une alternative sans GSAP est documentée.
4. **Icônes et palette** : `@fs0lab/icons` (~150 SVG sur une grille de 24 px, outline et solid, ~20 variantes animées) avec les paquets générés `icons-svelte`, `icons-react` et `icons-astro`. `@fs0lab/palette` est disponible en bibliothèque, en CLI `fs0` et en outil web : échelles OKLCH de 50 à 950, contrastes AA et APCA, simulation des daltonismes, export en tokens. À cela s'ajoute la police **fs0 Mono**, dérivée de Martian Mono (OFL), en woff2 auto-hébergé.
5. **Doc vitrine Astro** (modèle : maquette F) : accueil animé (intro « D · Motion »), playground par framework, générateur de palettes, explorateur d'icônes, pages tokens, motion et accessibilité. Déployée sur Coolify, sous un sous-domaine Cloudflare.

## Hors périmètre v1

- Plugin Figma, police d'icônes, icônes multicolores, marketplace de thèmes.
- Date picker et combobox.

## Contraintes

- **Délai** : pas d'échéance ferme. Livraison par jalons, avec des versions 0.x publiées au fil de l'eau jusqu'à la 1.0.0.
- **Technique** : monorepo pnpm + Turborepo, TypeScript, ESM, tree-shakable, SSR-safe. Versions gérées par changesets, provenance npm, CI sur GitHub Actions.
- **Support** : navigateurs evergreen (Baseline 2024 : OKLCH, `:has()`, `@layer` et View Transitions sans polyfill), Node 22 LTS.
- **Licences** : MIT pour le code. OFL pour fs0 Mono : nom réservé changé, licence et mentions conservées. GSAP sous sa propre licence, en peer dependency, jamais embarqué.
- **Hébergement** : doc sur Coolify, sous-domaine Cloudflare.

## Critères de réussite

- WCAG 2.2 AA : navigation clavier, focus visibles, ARIA correct. axe sans violation sur tous les composants et toutes les pages de doc.
- Tests Vitest, Playwright et snapshots visuels au vert en CI. Lint des SVG.
- Chaque paquet publié sur npm avec provenance, importable en SSR (SvelteKit, Next.js RSC, Astro) sans erreur.
- `prefers-reduced-motion` respecté partout : aucune boucle, états finaux affichés.
- Doc en ligne sur son sous-domaine, avec un score Lighthouse ≥ 95 en accessibilité et en bonnes pratiques.
