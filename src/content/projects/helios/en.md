---
name: Helios
repo: Helios
repoId: 1303726001
lang: TypeScript
date: '2026-07-17'
since: Jul 2026
stars: 0
kind: img
img:
  src: /assets/helios_cover.webp
  w: 795
  h: 895
hero:
  src: /assets/hero_helios.webp
  w: 1600
  h: 857
pos: 58% 50%
home: https://heliios.vercel.app
desc: "3D Solar System explorer asking what other worlds would feel like, on sourced NASA/JPL data that labels every approximation."
topics:
  - react-three-fiber
  - nextjs
  - webgl
  - nasa-api
area: web
order: 1
case:
  lede: "Planetary science at human scale: your weight on Mars, the length of a day on Venus, the time sunlight needs to reach Neptune."
  stack: Next.js 16 · React 19 · TypeScript · Three.js / React Three Fiber · Zustand · Tailwind v4 · Zod · Vitest · Playwright
  facts:
    - - "57"
      - Solar System bodies with detail pages
    - - EN / TR
      - full bilingual support
    - - "2"
      - scale modes, one strictly linear
  sections:
    - kind: overview
      title: Overview
      paras:
        - "Helios is an interactive 3D explorer of the Solar System, built as a portfolio project that treats its product and scientific constraints as production requirements: numbers are sourced, and anything approximate says so."
    - title: What’s inside
      list:
        - - 57 real bodies
          - Detail pages for 57 Solar System bodies and four regions, plus eight custom planet pages.
        - - Explore timeline
          - Follow worlds through time. Accelerated playback is labeled approximate.
        - - Compare two worlds
          - A shareable side-by-side for human-scale context.
        - - Missions index
          - A sourced index of missions.
        - - Two scale modes
          - One tuned for legibility, one strictly linear for radii and distance.
        - - English and Turkish
          - Full EN/TR support, including a separately labeled galactic context schematic.
    - title: Where the data comes from
      paras:
        - Dynamic data is validated on the server. When a source fails, a verified snapshot is used and the fallback is labeled on screen.
      list:
        - - NASA / JPL
          - Physical parameters and approximate orbital elements.
        - - JPL Horizons
          - Sourced vectors for selected dates in the Explore timeline.
        - - NASA NeoWs
          - Current near-Earth objects, through a server-only key.
        - - APOD and DONKI
          - Keyless public endpoints.
    - title: Screens
      gal:
        - - src: /assets/helios_home.webp
            w: 1686
            h: 1039
          - Helios home page
        - - src: /assets/helios_explore.webp
            w: 1686
            h: 1037
          - Explore view of the Solar System
        - - src: /assets/helios_earth.webp
            w: 1685
            h: 1036
          - Earth in Explore with time controls
---
