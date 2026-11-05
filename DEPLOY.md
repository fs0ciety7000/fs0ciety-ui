# DEPLOY.md

> Plan de déploiement du projet. Aucune valeur secrète ici : noms de variables seulement. Voir le skill `deploy-coolify-cloudflare`.

Deux sorties distinctes :

- **Doc vitrine** (`apps/docs`) : site statique sur Coolify, décrit ci-dessous.
- **Paquets npm** (`packages/*`) : publiés par GitHub Actions (`.github/workflows/release.yml`, changesets + provenance). Rien n'est publié depuis Coolify.

## Cible (doc)

- **Plateforme** : Coolify, serveur `localhost` (hôte de `fs0ciety.org`), projet Coolify `fs0ciety-ui`, environnement `production`.
- **Source Git** : `github.com/fs0ciety7000/fs0ciety-ui` (public), via la GitHub App déjà utilisée par les autres applications (source id 1). Branche de production : `main`. Pas de préproduction ni d'aperçus de PR.
- **Mode de build** : Dockerfile `apps/docs/Dockerfile`, contexte = racine du dépôt (`base_directory` `/`). Étape 1 `node:22-alpine` + pnpm (`turbo run build --filter=@fs0lab/docs...`), étape 2 `caddy:2-alpine` qui sert `dist/`.
- **Port d'écoute** : `8080`.
- **Route de santé** : `GET /health` → `200 ok` (Caddyfile), contrôle Coolify activé sur le port 8080.

## Variables

| Nom        | Quand | Rôle                                                                           |
| ---------- | ----- | ------------------------------------------------------------------------------ |
| _(aucune)_ |       | La doc est statique et n'a besoin d'aucune variable au build ni à l'exécution. |

CI GitHub (pas Coolify) :

| Nom            | Où                     | Rôle                                                                                              |
| -------------- | ---------------------- | ------------------------------------------------------------------------------------------------- |
| `NPM_TOKEN`    | secret du dépôt GitHub | publication npm du scope `@fs0lab` (jeton « Automation » ou granulaire, écriture sur `@fs0lab/*`) |
| `GITHUB_TOKEN` | fourni par Actions     | PR de version changesets                                                                          |

Les valeurs vivent dans la ressource concernée et dans `secrets/` (chiffré). Jamais dans le dépôt.

## Données

- **Volume persistant** : aucun. Le site est reconstruit à chaque déploiement.
- **Sauvegarde** : inutile pour l'application. La source est dans Git.

## Domaine

- **FQDN** : `https://ui.fs0ciety.org`
- **Zone Cloudflare** : `fs0ciety.org` (`7c749c5d4c715e429122addb7f3829d7`)
- **Enregistrement DNS à créer** : type `CNAME`, nom `ui`, cible `fs0ciety.org`, proxifié `oui` (même schéma que les autres applications Coolify de la zone). Nom vérifié libre le 2026-11-05.
- **SSL/TLS** : Full (strict). Jamais « Flexible ». Si le certificat Let's Encrypt ne s'émet pas derrière le proxy, passer l'enregistrement temporairement en DNS seul.
- **Cache** : Caddy envoie `Cache-Control: immutable` sur `/_astro/*`. Les pages HTML ne sont pas mises en cache longtemps.

## Mise en production

1. `pnpm lint`, `pnpm build`, `pnpm typecheck` et `pnpm test` passent.
2. Dépôt GitHub public créé, `main` poussée.
3. Enregistrement DNS `ui` créé.
4. Application Coolify créée (Dockerfile, port 8080, santé `/health`, domaine `https://ui.fs0ciety.org`, déploiement automatique sur push de `main`).
5. Vérification : statut `running:healthy`, `https://ui.fs0ciety.org` et `/health` répondent 200, logs récents sans erreur.

## Retour arrière

Redéployer le commit précédent depuis Coolify (onglet Deployments, puis « Redeploy » sur le déploiement sain), ou `git revert` puis push sur `main`. Aucune donnée à restaurer.
