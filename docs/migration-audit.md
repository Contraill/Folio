# Prototype migration audit

Inventory of the approved prototype (kept locally, not in this repository) against the production application. Updated as pages move over.

## Routes

The prototype used hash routes; production uses real paths.

| Prototype | Production | Interactive islands | Status |
| --- | --- | --- | --- |
| `#home` | `/` | Hero stages, Mochi; tilt and parallax from the motion layer | Migrated |
| `#projects`, `#projects-<area>` | `/projects`, `/projects?area=<area>` | Gallery and index, filters with FLIP, hover peek | Migrated |
| `#project-<id>` | `/projects/<id>` | Gallery, lightbox, master-detail, shared media morph | Migrated |
| `#lab` | `/lab` | Contour field | Migrated |
| `#play` | `/play` | Toy box physics | Migrated |
| `#about` | `/about` | Mochi | Migrated |
| `#cv` | `/cv` | Language switch, copy, print | Migrated |
| `#uses` | `/uses` (unlisted) | None | Migrated |
| `#now` | `/now` (unlisted) | None | Migrated |
| `#secret` | `/secret` (unlisted) | Draggable letters, unlocks a star in Play | Migrated |
| `#admin` | Removed; replaced by `admin.oztozlu.dev` in M4 | | Gone |
| anything else | 404 | Mochi looking dizzy | Migrated |

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
| Shared media morph | Migrated |
| First-load choreography | Migrated |

## Differences from the prototype

Visual ones are listed in `src/styles/adaptations.css`. Behavioural ones:

| Prototype | Production | Why |
| --- | --- | --- |
| Search listed unlisted pages and `/admin`, and `/secret` for its exact word | Public entries only | Unlisted pages must stay out of search |
| ⌘K shown on every platform | Label follows the platform, hidden on touch | Device-dependent text |
| Focus lost when a sheet closed | Returns to the opener, or to the new page | Keyboard accessibility |
| Print showed a toast about the preview sandbox | Just prints | Text only made sense in the prototype |
| Scroll always reset, even going back | Back and forward restore position | Router default, closer to expected behaviour |
| Nothing rendered without JavaScript | Complete server-rendered pages | Production requirement |
| Language picked only on the CV | Site-wide, with a switch in the footer and mobile menu; the CV keeps its own | Requirement |
| "Pinned on GitHub", hard-coded | "Featured", an explicit choice | The old label claimed something nothing checked |
| Hero: huepr, Helios, Nothing (a static image) | Helios, huepr, Mochi: every slide is live | "Things that react"; Nothing moves to Selected work |
| Every project public | Explicit `PUBLISHED` set: the seven featured and selected projects; the rest stay candidates | Publishing must never be automatic |
| "Each one has a write-up" on Selected work | Sentence removed | Not true of the projects shown |
| Device-specific copy ("point at", "drag", "tap", "Keys and touch") | Neutral wording, same on every device | Requirement |
| Filter history not part of the page transition | Same, and returning from a project restores the filter | Behaviour kept across real URLs |
| Monogram alone as the home link | Monogram with the name; the monogram alone below 375 px | The monogram was not recognisable as the way home |
| Transitions about 0.9 s, clicks lost meanwhile | About 0.7 s, a press ends the transition and still lands | Faster to use, same choreography |
| Lab and Play drew every frame even when paused | Drawing stops when nothing changes and resumes on input | Battery and CPU |
| Placeholder favicon | The monogram drawn for tab sizes, in the active skin's colours; `favicon.ico` and a touch icon as fallbacks | The tab carries the identity and follows the chosen skin |
| Touching the toy box on a phone only worked sideways | Grabbing a piece works in any direction; empty space still scrolls | Touch usability |
| Orrery labels only on hover, lost when a finger lifted | Walks through the planets by itself, keyboard support, label stays after a tap | Accessibility and touch |

## Known remaining issues

- GitHub star counts in the seed are from a snapshot (Nothing KDE Theme shows 11, the live value is 14). Resolved by the sync in M5.
- Placeholder notes stay visible until the content exists; see the launch checklist in [roadmap.md](roadmap.md).
- The footer wordmark and the large case-study index are decorative, low-contrast by design and hidden from assistive technology. Automated contrast checks flag them.

## Removed from the prototype

Tailwind and its plugins, the unused interface scaffold, most runtime dependencies (43 packages down to 10), the single-file build and its tooling, scaffold assets. The unused lander and snake engines.
