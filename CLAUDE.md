# CLAUDE.md

> Lu automatiquement à chaque session. Court exprès. Les règles générales (langue, secrets, routage des skills et des agents) sont dans `~/.claude/CLAUDE.md`.

@AGENTS.md

## Projet courant

- **Type** : `web-frontend`, `design-ui`, `motion`, `deploy` (voir `~/.claude/skills-registry.md`)
- **Stack** : pnpm 11 + Turborepo, TypeScript 6 (strict, ESM), Biome, Vitest, Playwright + axe, changesets ; tokens Style Dictionary v5 ; Svelte 5, React 19, Astro 7 ; GSAP en peer.
- **Commandes** : voir `AGENTS.md` (`pnpm lint`, `pnpm build`, `pnpm typecheck`, `pnpm test`).
- **Déploiement** : doc `apps/docs` uniquement, Dockerfile (Caddy, port 8080, `/health`) sur Coolify + sous-domaine Cloudflare. Paquets : npm via `release.yml`.

## Documents du projet

- `docs/brief.md` : objectif, périmètre, contraintes.
- `DESIGN.md` : direction visuelle (couleurs, typographie, composants). À respecter pour toute interface.
- `DEPLOY.md` : cible Coolify ou Cloudflare, sous-domaine, DNS, variables (noms), retour arrière.

## Spécifique à ce projet

- **Option A, le CSS d'abord** : tout le style vit dans `@fs0lab/css` (classes `.fs-*`, attributs `data-*`, `@layer fs.*`). Les paquets Svelte, React et Astro ne font que poser le même HTML, sans style propre. Les comportements passent par le natif (`<dialog>`, `popover`, `<select>`), sinon par `@fs0lab/core`.
- **Parité** : un composant n'est terminé que lorsqu'il a la même API (props, slots/children, événements) dans les trois frameworks. Svelte est livré en premier.
- **SSR-safe** : aucun accès à `window` ou `document` au chargement d'un module. `sideEffects` doit rester exact dans chaque `package.json`.
- **Reduced motion** : tout effet ou preset doit avoir un état final statique sous `prefers-reduced-motion`, sans boucle.
- **Licences** : MIT. `packages/font` est sous OFL-1.1 : ne pas utiliser le nom « Martian Mono » et garder `OFL.txt` et `FONTLOG.txt` à jour. GSAP n'est jamais embarqué.
- **TypeScript 6** : ne pas passer à TS 7 tant que svelte-check, `@sveltejs/package` et `@astrojs/check` ne le supportent pas.
- Variables d'environnement : noms et rôle dans `.env.example` ; valeurs chiffrées dans `secrets/` (`kit secrets`).
