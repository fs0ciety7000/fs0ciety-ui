# AGENTS.md

Règles communes à tous les agents de code (Claude Code, Codex, Cursor...). Format neutre : rien ici n'est propre à Claude.

## Contexte

- **Nom** : fs0ciety (paquets npm `@fs0lab/*`)
- **Type** : design system en monorepo (web-frontend, design-ui, motion, deploy pour la doc)
- **Résumé en une phrase** : design system « Schematic Bleed » (tokens, CSS, motion, icônes, composants Svelte/React/Astro) publié sur npm, avec une doc vitrine Astro.

## Commandes

```bash
install:   pnpm install                # Node >= 22, pnpm 11
dev:       pnpm dev                    # turbo, toutes les tâches dev
test:      pnpm test                   # vitest par paquet
lint:      pnpm lint                   # biome check (format: pnpm format)
typecheck: pnpm typecheck              # tsc / svelte-check / astro check
build:     pnpm build                  # turbo, ordre des dépendances
release:   pnpm changeset              # décrire un changement publié
```

Un seul paquet : `pnpm --filter @fs0lab/<nom> <script>`.

## Structure du dépôt

```
.
├── AGENTS.md
├── CLAUDE.md
├── DESIGN.md           # direction visuelle
├── DEPLOY.md           # Coolify / Cloudflare, domaine, variables (noms)
├── docs/brief.md       # objectif et périmètre
├── .env.example        # noms des variables, valeurs factices
├── secrets/            # secrets chiffrés (sops + age), commitables
├── .changeset/         # versions et changelogs (changesets)
├── .github/workflows/  # ci.yml (lint, build, typecheck, test), release.yml (npm + provenance)
├── packages/
│   ├── tokens/         # W3C DTCG → CSS vars, JS/TS, preset Tailwind, JSON Figma
│   ├── palette/        # générateur OKLCH (lib + CLI fs0)
│   ├── css/            # reset, base, utilitaires, effets ; TOUT le style des composants
│   ├── core/           # contrôleurs de comportement en JS pur (partagés)
│   ├── motion/         # presets GSAP (peer) + adaptateurs
│   ├── svelte/ react/ astro/                       # enveloppes fines, même API
│   ├── icons/ icons-svelte/ icons-react/ icons-astro/
│   └── font/           # fs0 Mono (OFL)
└── apps/docs/          # doc vitrine Astro (statique, Caddy, Dockerfile)
```

## Règles de travail

1. Lis avant d'écrire : ouvre les fichiers concernés avant de les modifier.
2. Plus petit changement qui résout le problème. Pas de refactor non demandé.
3. Suis le style existant (nommage, formatage, structure).
4. Ajoute ou mets à jour les tests avec chaque changement de comportement.
5. Lance `test` et `lint` avant de conclure ; rapporte les résultats réels.
6. Ne touche jamais à : `.env*`, `dist/`, `build/`, fichiers de lock modifiés à la main.
7. Tâche de plus de ~5 fichiers ou changement d'architecture : propose d'abord un plan.

## Sécurité

- Aucun secret dans le code, les logs ou les commits. Les secrets passent par `kit secrets`.
- Valide toutes les entrées externes ; requêtes SQL paramétrées uniquement.
- Confirmation avant toute action destructive (suppression, reset, migration ou déploiement en prod).
