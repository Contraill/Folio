---
name: Orbis
repo: Orbis
repoId: 1406926081
lang: Python
date: '2026-10-06'
since: Oct 2026
stars: 0
kind: img
img:
  src: /assets/card_orbis.webp
  w: 900
  h: 556
hero:
  src: /assets/hero_orbis.webp
  w: 1683
  h: 1039
pos: 50% 38%
desc: "A media server for one household on a Raspberry Pi 5: profiles with their own language and progress, Watch Together rooms and TV launchers, playing from providers the owner installs."
topics:
  - fastapi
  - react
  - docker
  - raspberry-pi
area: self-hosted
order: 3
case:
  lede: "A household’s own place to watch: everyone gets a profile, and a room code lets several people watch together."
  stack: "FastAPI · SQLAlchemy · Alembic · SQLite · React · TypeScript · Vite · Shaka Player · Docker Compose · webOS / Tizen"
  facts:
    - - "6"
      - "digit codes for Watch Together rooms"
    - - "2"
      - "TV launchers: LG webOS and Samsung Tizen"
    - - "0"
      - "streaming providers shipped: the owner installs their own"
  sections:
    - kind: overview
      title: "Overview"
      paras:
        - "Orbis is a self-hosted media interface for a small household, built to run on a Raspberry Pi 5 with Docker. The catalogue comes from TMDB, and playback from provider adapters the owner installs: Orbis ships none for general streaming."
    - title: "What it does"
      list:
        - - "Profiles"
          - "Each profile keeps its own language, list, progress and watch history, in English or Turkish."
        - - "Discovery"
          - "Home, movie and series shelves shaped by each profile, with local full-text search."
        - - "Playback"
          - "Picks a provider and source by itself and falls back when one fails; the viewer chooses quality, audio and subtitles."
        - - "Watch Together"
          - "Rooms joined with a six-digit code: everyone browses on their own until playback starts, then play, pause and the timeline stay in sync."
        - - "Admin"
          - "Only the owner profile has a password, for providers, settings, diagnostics and sessions."
        - - "TV launchers"
          - "Optional LG webOS and Samsung Tizen shells that open the same web interface on a TV."
    - title: "How it fits together"
      paras:
        - "Browsers and the TV launchers open the same React frontend; the FastAPI backend owns everything else."
      list:
        - - "Frontend"
          - "React, TypeScript and Vite behind nginx; Shaka Player loads only on playback pages."
        - - "Backend"
          - "FastAPI with SQLAlchemy, and Alembic migrations applied at start-up; SQLite holds profiles, progress and the search index."
        - - "Providers"
          - "Trusted Python modules installed and versioned through Admin, kept outside the repository; they run as the owner’s code, not in a sandbox."
        - - "Proxied playback"
          - "The backend proxies media, so source addresses and headers never reach the browser."
        - - "Tests"
          - "pytest covers the API, migrations, playback, providers, recommendations and Watch Together with synthetic fixtures; no test needs a real provider."
    - title: "Limits"
      paras:
        - "Watch Together rooms live in the backend’s memory and end when it restarts, and there is no chat, voice, download or parental control. The TV launchers are built and tested in CI, not on a physical TV. Orbis is meant for a trusted home network."
---
