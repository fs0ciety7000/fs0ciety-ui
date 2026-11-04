# DESIGN.md

> Direction visuelle de fs0ciety (`@fs0lab/*`), lue par les agents de design et de front. Direction retenue : **D « Schematic Bleed »** (défaut), **E « Night Shift »** (dashboards), **Light** (papier de plan). Sources visuelles : `docs/mockups/D-schematic-bleed.html`, `D-motion-gsap.html`, `E-night-shift.html`, `F-docs-landing.html`.
> Tout le style vit dans `@fs0lab/css` (`.fs-*`, `data-*`, layers `fs.reset, fs.tokens, fs.base, fs.components, fs.utilities, fs.effects`). Thème : `data-fs-theme="schematic|night|light"` sur `<html>` ; sans attribut, `prefers-color-scheme` choisit schematic ou light.

## Principes

1. **Un plan technique, pas une affiche.** Chaque écran se lit comme un schéma : cadres, cotes, légendes numérotées (`01 —`, `Fig. 2`). La structure est visible, la décoration ne l'est pas.
2. **Le filet de 1 px porte tout.** Séparations, cadres et champs sont des traits, pas des aplats ni des ombres. L'épaisseur signale la fonction : 1 px structure, 2 px repère ou focus, 5–7 px câble.
3. **Le chaud est un signal.** Corail et braise ne servent qu'à ce qui demande l'attention : action principale, état, alerte, câble. Le reste est froid (glacier, phosphore, indigo).
4. **Effets brefs et espacés.** Un glitch dure 0,3 s et revient au mieux toutes les 4 s. Un écran au repos est immobile.
5. **L'accessibilité n'est pas un mode.** WCAG 2.2 AA dans les trois thèmes, effets coupés sous `prefers-reduced-motion`, retirés sous `prefers-contrast: more` et `forced-colors`.

## Couleurs

### Primitives

Nommage `--fs-color-<hue>-<step>`, steps 50–950 générés par `@fs0lab/palette` (OKLCH, teinte constante, chroma réduite aux extrêmes). Les neutres ont des pas intermédiaires (850, 925) pour les fonds sombres. Seuls les ancrages utilisés par les tokens sémantiques sont listés ; OKLCH arrondi, le build (culori) fait foi.

| Token | Hex | OKLCH | Nom maquette |
| --- | --- | --- | --- |
| `ink-950` | `#050608` | `oklch(12.2% 0.006 260)` | void |
| `ink-925` | `#07090D` | `oklch(13.9% 0.010 262)` | surface D |
| `ink-900` | `#0C1119` | `oklch(17.6% 0.018 260)` | (nouveau) surface relevée |
| `ink-700` | `#3A4A63` | `oklch(40.6% 0.047 259)` | (nouveau) texte secondaire light |
| `ink-600` | `#56657D` | `oklch(50.4% 0.043 260)` | (nouveau) texte discret light |
| `ink-400` | `#7F93AD` | `oklch(65.7% 0.045 255)` | muted (désactivé seulement, voir plus bas) |
| `ink-300` | `#9CB0C8` | `oklch(75.0% 0.041 253)` | (nouveau) muted corrigé |
| `ink-200` | `#AFC1D6` | `oklch(80.4% 0.036 252)` | texte secondaire D |
| `ink-100` | `#DCE8F7` | `oklch(92.6% 0.024 254)` | phosphore |
| `ink-50` | `#F2F7FF` | `oklch(97.5% 0.012 260)` | titre |
| `trace-200` | `#C6E2FF` | `oklch(90.2% 0.050 249)` | lien survolé |
| `trace-300` | `#8EC5FF` | `oklch(80.7% 0.101 250)` | trace |
| `trace-800` | `#2B4A75` | `oklch(40.7% 0.082 257)` | filet |
| `blue-500` | `#5B8CFF` | `oklch(66.2% 0.179 265)` | câble |
| `blue-700` | `#1F4FB8` | `oklch(46.2% 0.174 263)` | (nouveau) encre de plan |
| `coral-500` | `#FF4F7B` | `oklch(68.4% 0.212 10)` | corail |
| `coral-700` | `#BF1F4B` | `oklch(52.5% 0.192 12)` | échelle F |
| `red-500` | `#FF5A36` | `oklch(68.4% 0.207 34)` | (nouveau) danger, distinct du corail |
| `red-700` | `#B8260F` | `oklch(50.9% 0.185 32)` | (nouveau) danger light |
| `ember-500` | `#FF9A3C` | `oklch(77.6% 0.159 59)` | braise |
| `ember-800` | `#A8530A` | `oklch(53.7% 0.134 52)` | (nouveau) |
| `vivant-400` | `#3DDC6B` | `oklch(78.9% 0.202 149)` | vivant |
| `vivant-700` | `#15703A` | `oklch(48.1% 0.118 152)` | (nouveau) |
| `indigo-950` | `#070A1F` | `oklch(15.6% 0.044 273)` | night |
| `indigo-900` | `#0D1233` | `oklch(20.0% 0.065 273)` | surface E |
| `indigo-850` | `#141A45` | `oklch(24.1% 0.080 273)` | bouton secondaire E |
| `indigo-800` | `#1C2250` | `oklch(27.5% 0.084 274)` | filet E |
| `indigo-500` | `#5A68C8` | `oklch(55.4% 0.148 274)` | (nouveau) filet fort night |
| `indigo-300` | `#9AA3D6` | `oklch(72.7% 0.075 277)` | secondaire E |
| `indigo-200` | `#B9C0EA` | `oklch(81.6% 0.060 278)` | texte courant secondaire E |
| `indigo-100` | `#E4E7FF` | `oklch(93.3% 0.033 280)` | texte E |
| `matrix-500` | `#3B55E6` | `oklch(52.4% 0.220 269)` | matrix |
| `lavender-300` | `#B9A8FF` | `oklch(77.9% 0.123 292)` | lavande |
| `paper-100` | `#F5F3EC` | `oklch(96.4% 0.010 93)` | (nouveau) papier |
| `paper-50` | `#FBFAF6` | `oklch(98.5% 0.005 95)` | (nouveau) papier relevé |

### Tokens sémantiques

`--fs-<role>` ; les composants ne lisent que ceux-ci, jamais les primitives.

| Rôle | Schematic | Night | Light |
| --- | --- | --- | --- |
| `bg` | `ink-950` | `indigo-950` | `paper-100` |
| `surface` | `ink-925` | `indigo-900` | `paper-50` |
| `surface-raised` | `ink-900` | `indigo-850` | `#FFFFFF` |
| `line` (décoratif) | `trace-800` | `indigo-800` | `ink-200` |
| `line-strong` (bords de contrôles) | `trace-300` | `indigo-500` | `blue-700` |
| `text-strong` (display) | `ink-50` | `indigo-100` | `ink-950` |
| `text` | `ink-100` | `indigo-100` | `ink-900` |
| `text-muted` | `ink-200` | `indigo-200` | `ink-700` |
| `text-subtle` | `ink-300` | `indigo-300` | `ink-600` |
| `link` | `trace-300` (survol `trace-200`) | `trace-300` | `blue-700` |
| `accent` / `primary` | `coral-500` | `vivant-400` | `coral-700` |
| `on-accent` | `ink-950` | `indigo-950` | `#FFFFFF` |
| `focus-ring` | `coral-500` | `lavender-300` | `coral-700` |
| `success` | `vivant-400` | `vivant-400` | `vivant-700` |
| `warning` | `ember-500` | `ember-500` | `ember-800` |
| `danger` | `red-500` | `red-500` | `red-700` |
| `on-danger` | `ink-950` | `indigo-950` | `#FFFFFF` |
| `info` | `trace-300` | `trace-300` | `blue-700` |
| `cable-1 / 2 / 3` | `coral-500` / `blue-500` / `ember-500` | `matrix-500` / `vivant-400` / `lavender-300` | `coral-500` / `blue-500` / `ember-500` |
| `backdrop` | `ink-950` à 72 % | `indigo-950` à 72 % | `ink-900` à 40 % |

### Contrastes calculés (WCAG 2, et APCA 0.0.98G indicatif)

Pire cas : schematic et night sur `surface-raised` (fond le plus clair), light sur `bg` papier (fond le plus sombre).

| Paire | Schematic | Night | Light |
| --- | --- | --- | --- |
| `text` / `bg` | 16,3:1 · Lc −92 | 16,0:1 · Lc −93 | 17,0:1 · Lc 98 |
| `text` / pire fond | 15,3:1 | 13,6:1 | 17,0:1 |
| `text-muted` / `bg` | 11,0:1 · Lc −68 | 11,0:1 · Lc −70 | 8,1:1 · Lc 83 |
| `text-subtle` / `bg` (pire fond) | 9,1:1 (8,5) · Lc −58 | 8,0:1 (6,8) · Lc −54 | 5,3:1 · Lc 72 |
| `accent` comme texte / `bg` | 6,4:1 | 10,9:1 | 5,4:1 |
| `on-accent` / `accent` | 6,4:1 · Lc 46 | 10,9:1 | 6,0:1 |
| `link`, `info` / `bg` | 11,2:1 | 10,8:1 | 6,6:1 |
| `success` / `bg` | 11,2:1 | 10,9:1 | 5,6:1 |
| `warning` / `bg` | 9,6:1 | 9,3:1 | 4,8:1 |
| `danger` / `bg` (pire fond) | 6,5:1 · `on-danger` 6,5:1 | 6,3:1 (5,4) | 5,7:1 · `on-danger` 6,3:1 |
| `focus-ring` / `bg` (pire fond) | 6,4:1 (6,0) | 9,4:1 (8,0) | 5,4:1 |
| `line-strong` / `bg` (pire fond) | 11,2:1 (10,4) | 4,0:1 (3,4) | 6,6:1 |
| `line` / `bg` | **2,3:1** | **1,3:1** | **1,7:1** |

Écarts relevés dans les maquettes et corrections :

- **muted `#7F93AD`** passe WCAG (6,4:1 sur void) mais donne **Lc −43** : insuffisant pour les labels de 11 px majuscules qu'il porte dans D. Il devient `ink-400`, réservé au texte désactivé et aux graduations décoratives. Les labels passent à `text-muted` (`#AFC1D6`, Lc −68) ; `text-subtle` devient `ink-300` `#9CB0C8` (Lc −58), à utiliser à partir de 12 px pour les métadonnées non essentielles.
- **filets `line`** (`#2B4A75`, `#1C2250`) sont sous 3:1 : ils ne délimitent jamais seuls un contrôle. Champs, cases et boutons secondaires utilisent `line-strong`. Le bouton « Ignorer » en tirets `#2B4A75` de D reste possible, car son libellé identifie le contrôle, mais il passe à `line-strong` au survol et au focus.
- **bord de champ night `#2A3170`** (maquette E) : 1,65:1, échec 1.4.11. Il est remplacé par `indigo-500` `#5A68C8` (3,4:1 sur le pire fond).
- **bouton corail** : le texte void sur corail fait 6,4:1 mais seulement Lc 46 en APCA. Les libellés de bouton font donc au moins 14 px en graisse 600, jamais 13 px comme dans D.
- **matrix `#3B55E6`** fait 3,4:1 sur night : il convient aux traits et aux données, jamais au texte. Le texte posé sur un aplat matrix est `indigo-100` (4,7:1).
- **danger séparé de l'accent** (décision du 2026-11-05) : `red-500` `#FF5A36` (teinte 34, entre le corail à 10 et la braise à 59) pour qu'une action principale ne ressemble jamais à une suppression. L'icône d'alerte reste obligatoire, car la teinte seule ne suffit pas (1.4.1 et daltonismes).
- **light** : le texte blanc sur le corail `#FF4F7B` ne donne que 3,15:1. L'accent light est donc `coral-700` `#BF1F4B` (échelle F), avec un texte blanc à 6,0:1.

## Typographie

| Famille | Token | Pile | Usage |
| --- | --- | --- | --- |
| Display | `--fs-font-display` | `"fs0 Mono", "Martian Mono", ui-monospace, monospace` + `font-stretch: 75%` | titres H1–H2, labels, boutons, légendes |
| Texte | `--fs-font-sans` | `"Inter Tight", system-ui, sans-serif` | corps, H3–H4, descriptions |
| Mono | `--fs-font-mono` | `"fs0 Mono", "Martian Mono", ui-monospace, monospace` + `font-stretch: 100%` | code, données, valeurs de Readout et de Table |

Les deux familles sont sous licence OFL et auto-hébergées en woff2 (sous-ensemble latin étendu, `font-display: swap`). Aucun appel à Google Fonts en production.

| Token | Taille / interligne | Famille, graisse | Casse, tracking | Usage |
| --- | --- | --- | --- | --- |
| `--fs-text-2xs` | 11 / 16 px | display 500 | MAJ, +0.04em | légendes `Fig.`, cotes, unités |
| `--fs-text-xs` | 12 / 18 px | display 500 | MAJ, +0.02em | labels, nav, en-têtes de table, badges |
| `--fs-text-sm` | 14 / 21 px | sans 400 ou display 600 | boutons : MAJ, +0.02em | UI dense, cellules, aide de champ, boutons |
| `--fs-text-md` | 16 / 26 px | sans 400 | normal | corps de la doc (minimum) |
| `--fs-text-lg` | 18 / 28 px | sans 400 ou 600 | normal, −0.005em | chapô, H3 |
| `--fs-text-xl` | 28 / 32 px | display 700 | MAJ, −0.02em | H2 |
| `--fs-text-2xl` | `clamp(40px, 4vw + 1rem, 76px)` / 0,92 | display 800 | MAJ, −0.04em | H1 de page |
| `--fs-text-display` | `clamp(56px, 8vw, 108px)` / 0,9 | display 800 | MAJ, −0.04em | hero, une fois par page |

Règles :

- Labels en 11–12 px condensés et en majuscules, couleur `text-muted` ou `link`, jamais `text-subtle`. Le 11 px est réservé aux textes courts (≤ 4 mots).
- Corps de la doc en 16 px minimum, mesure de 60 à 75 caractères (`--fs-measure: 68ch`). Les majuscules condensées ne dépassent jamais une ligne de titre : au-delà de deux lignes, passer en Inter Tight 600 sans majuscules.
- Données en `font-variant-numeric: tabular-nums slashed-zero`, alignées à droite dans les tables.
- Le texte en majuscules est produit par `text-transform`, jamais saisi en capitales, pour que les lecteurs d'écran ne l'épellent pas.
- **Night Shift garde les mêmes familles.** La maquette E utilise Geist et Geist Mono : c'est un écart assumé de l'exploration, non repris. Un seul jeu de polices pour tout le système, cela veut dire un seul préchargement, une seule métrique et un hors-texte stable. Night adoucit par d'autres moyens : rayons, labels en `--fs-text-xs` sans majuscules permis dans les dashboards denses (`data-fs-case="normal"`).

## Espacements, largeurs, rayons, élévation, traits, icônes

**Espacement** : base 4 px, rythme de mise en page 8 px. `--fs-space-1` = 4 px, `2` = 8, `3` = 12, `4` = 16, `5` = 20, `6` = 24, `8` = 32, `10` = 40, `12` = 48, `16` = 64, `24` = 96. Écart entre composants d'un groupe : 8–12 px. Entre blocs : 24–48 px. Entre sections : 64 px (44 dans les planches D).

**Largeurs** : `--fs-measure` 68ch (prose), `--fs-width-narrow` 720 px (formulaires, articles), `--fs-width-content` 1152 px (doc, d'après F), `--fs-width-wide` 1280 px (dashboards). Gouttière 24 px, 16 px sous 640 px. Points de rupture : 640, 960 et 1280 px.

**Hauteurs de contrôle** : `--fs-control-sm` 32 px (dense, dashboards au pointeur seulement, ≥ 24 px WCAG 2.5.8), `--fs-control-md` 44 px (défaut), `--fs-control-lg` 52 px. Sur `(pointer: coarse)`, `sm` remonte à 44 px.

**Rayons**

| Token | Schematic | Night | Light |
| --- | --- | --- | --- |
| `--fs-radius-sm` (badge, kbd, case) | 0 | 2 px | 0 |
| `--fs-radius-md` (bouton, champ, tooltip) | 0 | 4 px | 0 |
| `--fs-radius-lg` (card, dialog, window) | 0 | 6 px | 0 |
| `--fs-radius-pill` (badge de statut, piste de switch) | 0 | 999 px | 0 |

E utilise 10 à 20 px. Je garde l'intention, un calme de salle de contrôle, mais à petite échelle, pour que les repères d'angle de Frame (toujours à 0) et les filets restent cohérents quand D et E cohabitent, comme dans F. Frame, Terminal et CodeBlock gardent un rayon 0 dans tous les thèmes.

**Élévation** : pas d'ombre portée floue. Les niveaux se lisent par le fond et le trait.

| Niveau | Fond | Trait | Extra |
| --- | --- | --- | --- |
| 0 page | `bg` | — | — |
| 1 card, panneau | `surface` | `line` | — |
| 2 window, menu, tooltip | `surface-raised` | `line-strong` | — |
| 3 dialog, toast | `surface-raised` | `line-strong` | `--fs-glow` + `backdrop` (dialog) |

`--fs-glow` : schematic `0 0 32px oklch(80.7% 0.101 250 / 0.12)`, night `0 0 32px oklch(52.4% 0.220 269 / 0.20)`, light `6px 6px 0 oklch(46.2% 0.174 263 / 0.10)` (décalage franc, comme une ombre d'impression).

**Traits** : `--fs-stroke-hairline` 1 px (filets, bords), `--fs-stroke-tick` 2 px (repères d'angle, onglet actif), `--fs-stroke-focus` 2 px, câbles `--fs-stroke-cable-sm|md|lg` 5 / 6 / 7 px, extrémités arrondies.

**Icônes** (`@fs0lab/icons`, grille 24) : tailles `--fs-icon-16|20|24|32`. Trait 1,25 à 24 et 32 px, 1,5 à 16 et 20 px pour rester lisible. `stroke-linecap` et `stroke-linejoin` passent par `--fs-icon-cap` : `square`/`miter` en schematic et light, `round`/`round` en night (comme dans E). Couleur `currentColor`. Une icône décorative porte `aria-hidden="true"` ; une icône seule exige un nom accessible sur son contrôle.

## Motifs signature

Les motifs vivent dans `fs.effects` et s'activent par attribut (`data-fs-fx="scan bleed grid"`). Ils sont tous décoratifs : `aria-hidden`, `pointer-events: none`, jamais porteurs d'information.

| Motif | Où | Où pas | `prefers-reduced-motion` | `prefers-contrast: more` / `forced-colors` |
| --- | --- | --- | --- | --- |
| **Frame** : repères d'angle 10 × 10 px en 2 px `line-strong`, cotes (trait 1 px et butées de 16 px, label 11 px), légende `Fig. n — titre` | hero, figures, médias, démo de composant, un bloc focal par vue | chaque card d'une grille, cadres imbriqués, formulaires | statique (pas de tracé animé) | conservé, cadre en `line-strong`. En `forced-colors`, les repères passent en `CanvasText`. |
| **Scanlines** : `repeating-linear-gradient`, 1 px de `trace-300` à 5 % toutes les 3 px | fonds de hero, Window média, Terminal | derrière du texte courant de plus de 2 lignes, en light (désactivé par défaut) | statique ; le balayage (`sweep`) est supprimé | retirées |
| **Décalage RVB** : `text-shadow` −2 px `coral-500` à 85 % et +2 px `trace-300` à 85 % | titres display et H1 (≥ 40 px), logo, survol du bouton primaire (2 pas) | corps, labels, champs, texte de moins de 32 px, contenu dynamique lu par un lecteur d'écran | ombre statique gardée, plus de saccade | retiré (texte net) |
| **Câbles** : courbes SVG `cable-1/2/3`, 5–7 px, opacité 0,8–0,9, impulsion de 3 px | hero, états vides, illustrations de section, intro | derrière du texte, dans les composants, plus de 3 câbles par vue | dessinés d'emblée, aucune impulsion | opacité réduite à 0,4 ; masqués en `forced-colors` |
| **Grille** : pas mineur 8 px (`line` à 12 %), majeur 64 px (`line` à 35 %) | playground, canvas, états vides, fond du thème light | derrière une table ou un long texte | statique | retirée |

Night ajoute la **pluie de données** (colonnes de chiffres `matrix-500`, opacité dégressive) et la **respiration** des barres (6 s). Ces deux effets se limitent au fond des dashboards : ils sont figés sous reduced-motion et retirés sous contrast-more.

## Composants v1

Socle commun : cible ≥ 44 px (`control-md`), ou 32 px en densité `sm` au pointeur fin. Focus `:focus-visible` = `outline: 2px solid var(--fs-focus-ring); outline-offset: 2px`. L'anneau est entier, ≥ 3:1 sur le fond adjacent et jamais masqué par un en-tête collant (`scroll-padding-top`), ce qui couvre 2.4.11 et 2.4.13. États via `data-state`, `aria-*` et `:disabled`. Désactivé = `text-subtle` sur `ink-400`, opacité 0,5, trait en tirets, `cursor: not-allowed`. Erreur = `danger` + icône + message lié par `aria-describedby`, jamais la couleur seule. Chargement = `aria-busy="true"`, libellé conservé, spinner remplacé par une barre de 2 px balayée (texte « Chargement » sous reduced-motion).

| Composant | Anatomie, variantes, états |
| --- | --- |
| **Button** | Libellé display 14 px MAJ 600, icône optionnelle. `primary` (aplat `accent`, texte `on-accent`), `secondary` (trait `line-strong`, texte `link`), `ghost` (trait `line` en tirets, texte `text-muted`), `danger` (trait et texte `danger`, icône d'alerte obligatoire). Survol : `secondary` s'inverse (aplat `trace-300`), `primary` reçoit un décalage RVB en 2 pas (`steps(2)`, 120 ms). Actif : translation de 1 px. Chargement : largeur figée. |
| **IconButton** | Carré de 44 px, icône 20 px, `aria-label` obligatoire, tooltip identique au label. Mêmes variantes que Button. |
| **Input** | Label xs au-dessus, champ `surface` avec trait `line-strong` et rayon `md`, valeur en mono 14 px, aide et erreur en sm dessous. Préfixe et suffixe (unité) en `text-subtle`. Survol : trait `link`. Focus : anneau. Erreur : trait `danger`, `aria-invalid`. Lecture seule : trait `line`. |
| **Textarea** | Comme Input, en Inter Tight 16 px, redimensionnement vertical, compteur optionnel (`aria-live="polite"` au-delà de 90 %). |
| **Select** | `<select>` natif stylé (pas de listbox personnalisée en v1, le combobox est hors périmètre). Chevron 16 px, mêmes états qu'Input. |
| **Checkbox** | Case visuelle de 18 px, trait `line-strong`, rayon `sm`. Cochée : aplat `accent` et coche `on-accent`. Indéterminée : barre. Le label est cliquable et la zone de clic fait 44 px de haut. |
| **Switch** | `role="switch"`, piste de 40 × 20 px (rayon `pill`), curseur carré en schematic et light. On : piste `accent` et texte d'état visible (« ON / OFF » en xs). Zone de 44 px. |
| **Badge** | Texte xs MAJ, padding 4 × 8. `outline` (trait et texte de la couleur de statut), `solid` (aplat `danger` et texte `on-danger`, réservé à `danger`). Toujours un mot ou une icône qui dit l'état. Non interactif. |
| **Card** | `surface`, trait `line`, padding 24, en-tête `01 — Titre` en xs. Cliquable : toute la carte est un lien unique (pseudo-élément étiré), trait `line-strong` au survol. États vide et chargement prévus (squelette = filets en pointillés, pas de shimmer). |
| **Frame** | Conteneur sans fond avec repères d'angle, cotes optionnelles et légende `<figcaption>` « Fig. n ». Rayon 0 partout. Voir Motifs. |
| **Window** | Barre de titre (label xs `text-muted`, contrôles IconButton `sm`), corps `surface-raised`, trait `line-strong`. Ouverture `fs-boot`. Peut porter les scanlines. |
| **Terminal** | Fond `bg`, mono 14 px, invite `$` en `success`, sortie en `text`, erreurs en `danger` préfixées `ERR`. `role="log"` si la sortie est vivante. Curseur clignotant à 1 Hz, figé sous reduced-motion. |
| **Readout** | Label xs, valeur mono tabulaire (`text-xl`), unité en `text-subtle`, delta avec flèche et signe (pas la couleur seule). Animation `fs-count` sur la valeur, la valeur finale étant présente dans le DOM. |
| **Tabs** | `tablist` avec tabindex itinérant et flèches, Home/End. Onglet actif : trait de 2 px `accent` en bas et texte `text`. Inactif : `text-muted`. Panneau lié par `aria-controls`. |
| **Dialog** | `<dialog>` modal, `aria-labelledby`, focus piégé puis rendu à l'élément d'origine, Échap ferme. Niveau 3, largeur max 560 px, actions alignées à droite (primaire en dernier). Ouverture `fs-boot` 0,7 s maximum. |
| **Toast** | Coin bas droit, niveau 3, icône et titre, filet gauche de 2 px de la couleur de statut. `role="status"` (ou `alert` pour une erreur). Disparition après 6 s minimum, en pause au survol et au focus. Les erreurs restent jusqu'à fermeture. |
| **Tooltip** | `surface-raised`, trait `line-strong`, texte sm, délai de 300 ms. Visible au focus comme au survol, survolable, fermé par Échap (1.4.13). Jamais seul porteur d'information essentielle. |
| **Table** | `<caption>`, `th scope`, en-tête xs MAJ `text-muted`, lignes séparées par `line`, nombres tabulaires à droite. Densités `md` (44 px) et `sm` (32 px). Tri : bouton dans le `th` et `aria-sort`. État vide : une ligne qui explique quoi faire. Débordement : défilement horizontal dans une région focusable et labellisée. |
| **Kbd** | Mono xs, trait `line-strong`, ombre basse de 1 px en `line`. Combinaisons séparées par `+`. |
| **CodeBlock** | `<pre><code>` mono 14 px sur `bg`, trait `line`, label de langage xs, bouton Copier (IconButton `sm` avec annonce « Copié » via `aria-live`). Région focusable si elle défile. Coloration syntaxique sur les tokens (`link`, `success`, `warning`, `accent`, `text-muted`) à au moins 4,5:1. |

## Mouvement

Les tokens CSS servent dans `@fs0lab/css`. Les presets GSAP de `@fs0lab/motion` reprennent les mêmes valeurs.

| Durée | Valeur | Usage |
| --- | --- | --- |
| `--fs-duration-instant` | 120 ms | survol en 2 pas, appui |
| `--fs-duration-fast` | 150 ms | couleurs et fonds des contrôles |
| `--fs-duration-base` | 250 ms | tooltip, ligne CRT de `fs-boot` |
| `--fs-duration-moderate` | 450 ms | ouverture CRT, panneaux, tracé des cotes (500 ms) |
| `--fs-duration-slow` | 700 ms | cadre, titre lettre à lettre |
| `--fs-duration-draw` | 1400 ms | câbles |

| Courbe | Valeur CSS | Équivalent GSAP |
| --- | --- | --- |
| `--fs-ease-standard` | `cubic-bezier(0.165, 0.84, 0.44, 1)` | `power3.out` |
| `--fs-ease-rise` | `cubic-bezier(0.23, 1, 0.32, 1)` | `power4.out` |
| `--fs-ease-draw` | `cubic-bezier(0.645, 0.045, 0.355, 1)` | `power2.inOut` |
| `--fs-ease-boot` | `cubic-bezier(0.19, 1, 0.22, 1)` | `expo.out` |
| `--fs-ease-glitch` | `steps(1)` ; `steps(2)` au survol | `steps(1)` |
| `--fs-ease-linear` | `linear` | `none` |

| Preset | Valeurs (D · Motion) | Sous reduced-motion |
| --- | --- | --- |
| `fs-draw` | Tracé DrawSVG de 0 % sur 1,4 s, `power2.inOut`, décalage 0,15 s entre câbles. Cotes depuis `50% 50%` en 0,5 s, décalage 0,1 s. Impulsion optionnelle : tiret de 40/1400, 3,2 s linéaire, départ à 2,2 s. | traits complets, pas d'impulsion |
| `fs-scramble` | 0,9 s, décalage 0,12 s, jeu de caractères `01<>/#_ABCDEF`, `revealDelay` 0,2, `speed` 0,7. Le texte final est dans le DOM, la version brouillée en `aria-hidden`. | texte final immédiat |
| `fs-boot` | Ligne `scaleX` de 0 à 1 (`scaleY` 0,01, `brightness(3)`) en 0,25 s `power2.out`, puis `scaleY` à 1 et `brightness(1)` en 0,45 s `expo.out`. La légende de D indique 0,4 s, le code fait foi. | apparition sans transition (ou fondu de 150 ms si nécessaire) |
| `fs-glitch` | 5 pas de 40 ms (x ±10 px, y ±3 px, `skewX` ±12°, RVB ±6 px), retour en 50 ms, Window décalée de 6 px ×3. Environ 0,3 s au total. Déclenché au survol ou au hasard toutes les 4 à 8 s. | aucun |
| `fs-count` | La valeur converge vers la cible en 0,8 s `power2.out` (dans D, de 999 à 12). Le nombre final est rendu côté serveur ; seul l'affichage s'anime, sans annonce intermédiaire. | valeur finale |

Intro D (référence) : cadre en `clip-path` (0,7 s), repères `scale` 0 à 1 (0,3 s, décalage 0,06 s), câbles, cotes, scramble à 0,45 s, boot à 0,7 s, titre lettre à lettre `yPercent` 110 (0,6 s `power4.out`, décalage 0,045 s), panneau `x` 40 avec fondu (0,5 s). Fin à environ 2 s.

Règles :

- Glitch au plus toutes les 4 à 8 s, jamais en boucle serrée, jamais sur du texte en cours de lecture. Une seule zone en glitch par vue.
- Aucun flash de plus de 3 par seconde (2.3.1). Le glitch déplace et teinte sans inverser la luminance d'une grande surface ; le `brightness(3)` de `fs-boot` ne joue qu'une fois, sur une zone de moins de 25 % de la vue.
- Une boucle ambiante (impulsion, balayage, pluie, respiration) qui dure plus de 5 s a un contrôle Pause (2.2.2). La doc en expose un global (`data-fs-motion="paused"`), et les boucles s'arrêtent hors écran (`IntersectionObserver`).
- Toute animation part d'un DOM déjà dans son état final : sans JS, sans GSAP ou sous reduced-motion, la page est complète.
- Reduced-motion : états finaux, aucune boucle, aucun parallaxe. Seuls les fondus de 150 ms au plus et les changements de couleur restent. L'alternative sans GSAP (CSS `@keyframes` et `animation-timeline`) respecte les mêmes valeurs.

## Accessibilité

Engagements WCAG 2.2 AA propres au système :

- **1.4.3 / 1.4.11** : chaque paire sémantique est vérifiée en CI (tableau ci-dessus, recalculé depuis les tokens). Texte ≥ 4,5:1, grand texte et bords de contrôles ≥ 3:1. `line` reste décoratif.
- **1.4.1** : statut toujours doublé d'un mot ou d'une icône (Badge, Toast, Readout, erreurs).
- **1.4.4 / 1.4.10 / 1.4.12** : tailles en `rem`, display en `clamp()`, aucune hauteur fixe sur le texte, reflow à 320 px, tracking et interlignage modifiables sans coupure.
- **1.4.13** : Tooltip survolable, persistant et fermable par Échap.
- **2.1 / 2.4.3 / 2.4.7 / 2.4.11 / 2.4.13** : tout au clavier, ordre DOM logique, anneau de 2 px décalé de 2 px, jamais masqué par un en-tête collant.
- **2.2.2 / 2.3.1** : boucles en pause possible, pas de flash, voir Mouvement.
- **2.5.8** : 44 px par défaut, 24 px minimum absolu (densité `sm` à 32 px, pointeur fin seulement).
- **4.1.2** : ARIA natif d'abord (`<dialog>`, `<select>`, `<button>`), rôles APG pour Tabs et Switch, nom accessible obligatoire pour IconButton.
- **Préférences** : `prefers-reduced-motion` (états finaux), `prefers-contrast: more` (`line` devient `line-strong`, `text-subtle` devient `text-muted`, effets retirés), `forced-colors: active` (couleurs système, focus `Highlight`, câbles et scanlines masqués).
- Vérification : axe sans violation dans les trois thèmes, Playwright au clavier, snapshots avec reduced-motion activé et désactivé.

## À éviter

- Dégradés décoratifs, glassmorphism, `backdrop-filter: blur`, ombres portées floues.
- Rayons arrondis en schematic et light. Rayons au-delà de 6 px en night.
- Corail ou braise en décoration (fond de section, titre, icône neutre) : le chaud est un signal.
- La couleur seule pour porter un état, un lien ou une erreur.
- Texte posé sur `line`, `matrix-500` ou `ink-400`. Labels de 11 px en `text-subtle`.
- Décalage RVB ou glitch sur du corps de texte, un champ ou un contenu qui change pendant la lecture.
- Plus d'un Frame focal par vue, des cadres imbriqués, plus de trois câbles.
- Boucles sans pause, effets lancés au chargement de chaque page de doc (l'intro joue sur l'accueil seulement).
- Polices hors système (Geist, Space Mono…) ou chargées depuis un CDN tiers en production.
