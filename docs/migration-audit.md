# Prototype migration audit

Inventory of the approved prototype (kept locally, not in this repository) against the production application. Updated as pages move over.

## Routes

The prototype used hash routes; production uses real paths.

| Prototype | Production | Interactive islands | Status |
| --- | --- | --- | --- |
| `#home` | `/` | Hero stages (orrery, theme demo, Mochi), Selected work tilt and parallax, Mochi device | Stub |
| `#projects`, `#projects-<area>` | `/projects`, `/projects?area=<area>` | Gallery and index, filters with FLIP, hover peek | Stub |
| `#project-<id>` | `/projects/<id>` | Gallery, lightbox, master-detail, shared media morph | Stub |
| `#lab` | `/lab` | Contour field | Stub |
| `#play` | `/play` | Toy box physics | Stub |
| `#about` | `/about` | Mochi device | Stub |
| `#cv` | `/cv` | Language switch, copy, print | **Migrated** |
| `#uses` | `/uses` (unlisted) | None | Stub |
| `#now` | `/now` (unlisted) | None | Stub |
| `#secret` | `/secret` (unlisted) | Draggable letters, unlocks star in Play | Stub |
| `#admin` | Removed; replaced by `admin.oztozlu.dev` in M4 | | Gone |
| anything else | 404 | Mochi looking dizzy (M2) | Partial |

## Shared system

| Piece | Status |
| --- | --- |
| Skins, tokens, Auto from the clock, circular skin reveal | Migrated |
| Fonts (self-hosted, OFL notices added) | Migrated |
| Notched panels | Migrated, typed, unused features removed |
| Top bar, footer with wordmark | Migrated |
| Search palette | Migrated, public entries only |
| Contact sheet, mobile menu, skin menu | Migrated |
| Reveal, parallax, tilt and magnet layer | Migrated |
| Page transitions: directional, sliding indicator | Migrated |
| Shared media morph | M2 (needs the case-study page) |
| First-load choreography | Topbar migrated; hero part in M2 |

## Differences from the prototype

Visual ones are listed in `src/styles/adaptations.css`. Behavioural ones:

| Prototype | Production | Why |
| --- | --- | --- |
| Search listed unlisted pages and `/admin` | Public entries only; `/secret` still appears for its exact word | Unlisted pages must stay out of search |
| ⌘K shown on every platform | Label follows the platform, hidden on touch | Device-dependent text |
| Focus lost when a sheet closed | Returns to the opener, or to the new page | Keyboard accessibility |
| Print showed a toast about the preview sandbox | Just prints | Text only made sense in the prototype |
| Scroll always reset, even going back | Back and forward restore position | Router default, closer to expected behaviour |
| Nothing rendered without JavaScript | Complete server-rendered pages | Production requirement |
| Language picked only on the CV | Site-wide, with a switch in the footer legal row and the CV's own switch kept | Requirement; placement open for review |

## Known prototype issues not yet addressed

- In Terminal and Blueprint, notched panels keep a 24px radius, while those skins are described as square-cornered. Kept as approved; to confirm.
- On mobile the CV toolbar sits tight against the panel and the print button shows a heavy ring. Belongs to the M2 mobile pass.
- GitHub star counts in the seed are from a snapshot (Nothing KDE Theme shows 11, the live value is 14). Resolved by the sync in M5.

## Removed from the prototype

Tailwind and its plugins, the unused interface scaffold, most runtime dependencies (43 packages down to 10), the single-file build and its tooling, scaffold assets. The unused lander and snake engines go in M2.
