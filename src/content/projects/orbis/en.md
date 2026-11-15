---
name: Orbis
repo: Orbis
lang: Python
since: Oct 2026
img:
  src: /assets/card_orbis.webp
  w: 900
  h: 556
hero:
  src: /assets/hero_orbis.webp
  w: 1683
  h: 1039
pos: 50% 38%
desc: 'A media server for one household on a Raspberry Pi 5: profiles with their own language and progress, Watch Together rooms and TV launchers, playing from providers the owner installs.'
case:
  lede: 'A household’s own place to watch: everyone gets a profile, and a room code lets several people watch together.'
  stack: FastAPI · SQLAlchemy · Alembic · SQLite · React · TypeScript · Vite · Shaka Player · Docker Compose · webOS / Tizen
  facts:
  - - '6'
    - digit codes for Watch Together rooms
  - - '2'
    - 'TV launchers: LG webOS and Samsung Tizen'
  - - '0'
    - 'streaming providers shipped: the owner installs their own'
  sections:
  - title: Overview
    paras:
    - Orbis is a self-hosted media interface for a small household, running on a Raspberry Pi 5 with Docker. The catalogue comes from TMDB, and playback comes from provider adapters that the owner installs; Orbis itself ships none for general streaming.
  - title: Why I built it
    paras:
    - The aim was one place at home where everyone has their own profile, list and progress, that also opens on the TV, and where several people can watch the same thing in sync.
  - title: What I built
    list:
    - - Profiles
      - Each profile keeps its own language, list, progress and history. Only the owner profile has a password, for the admin area.
    - - Discovery
      - Home, movie and series shelves shaped by each profile, with local full-text search.
    - - Watch Together
      - 'Rooms joined with a six-digit code: everyone browses on their own until playback starts, then play, pause and the timeline stay in sync.'
    - - TV launchers
      - LG webOS and Samsung Tizen shells that only store the server address and open the same web interface, so there is a single interface to maintain.
  - title: The hard part
    list:
    - - Playback that recovers
      - Sources fail in different ways. Provider adapters only find a source; a separate part of the backend decides how it is delivered. When playback fails, the player reports the failure with the current position and the backend tries the next option, so viewing continues where it stopped.
    - - Headers stay on the server
      - Sources that need special request headers are relayed through the backend, so those headers never reach the browser.
    - - Providers outside the code
      - Providers are trusted Python modules, installed and versioned from the admin area and kept out of the repository. Tests use synthetic fixtures, so none of them needs a real provider.
  - title: Result
    paras:
    - 'In CI, pytest covers the API, database migrations, playback, providers, recommendations and Watch Together. Limits: Watch Together rooms live in the backend’s memory and end when it restarts, the TV launchers are tested in CI rather than on a physical TV, and Orbis is meant for a trusted home network. Giving providers a single job, finding a source, kept the playback logic in one place.'
---
