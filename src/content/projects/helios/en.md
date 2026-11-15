---
name: Helios
repo: Helios
lang: TypeScript
since: Jul 2026
home: https://heliios.vercel.app
img:
  src: /assets/helios_cover.webp
  w: 795
  h: 895
hero:
  src: /assets/hero_helios.webp
  w: 1600
  h: 857
pos: 58% 50%
desc: A 3D Solar System explorer that shows what other worlds would feel like, on NASA/JPL data that marks every approximation.
case:
  lede: 'Planetary science at human scale: your weight on Mars, the length of a day on Venus, the time sunlight needs to reach Neptune.'
  stack: Next.js 16 · React 19 · TypeScript · Three.js / React Three Fiber · Tailwind v4 · Zod · Vitest · Playwright
  facts:
  - - '57'
    - Solar System bodies with detail pages
  - - EN / TR
    - every page in both languages
  - - '2'
    - scale modes, one strictly linear
  sections:
  - title: Overview
    paras:
    - Helios is an interactive 3D explorer of the Solar System. It describes each world through things a person can relate to, such as gravity, the length of a day and a year, and how long light takes to get there, and every number comes from NASA/JPL.
  - title: Why I built it
    paras:
    - 'Most Solar System apps either turn into simulators that are hard to read, or hide weak data behind polished visuals. I wanted a scene that is free to explore and still trustworthy, so I treated scientific accuracy as a product requirement: every number has a source, and anything approximate says so on screen.'
  - title: What I built
    list:
    - - One owner for the camera and time
      - Planets only report that they were selected; a single camera rig and a single simulation clock decide focus and time. No component can move the camera on its own, and returning to a date rebuilds the same scene.
    - - Two scale modes
      - One enlarges bodies and shortens distances so that everything is visible; the other uses one linear ratio for both radii and distances. Both run on the same systems, so there is no second implementation to keep in step.
    - - Data that shows its source
      - Server-side adapters validate responses from NASA/JPL, JPL Horizons, NeoWs, APOD and DONKI with Zod and cache each service separately. When a source fails, a verified snapshot takes over and the page says so.
    - - Information without 3D
      - Body pages and comparison tables are server-rendered HTML, and there is a fallback when WebGL isn’t available. The 3D view adds to the information instead of being the only way to reach it.
  - title: The hard part
    paras:
    - The main tension was between smooth motion, physical accuracy and readability.
    list:
    - - Smooth motion versus real orbits
      - 'Animation has to be smooth, but orbital data is exact only for certain dates. I kept the two apart: positions from JPL Horizons, average orbital elements and fast-forwarded previews each carry their own label, and missing values stay empty instead of being filled with guesses.'
    - - Opening without waiting
      - 'At first, a planet’s textures loaded when it was selected. I switched to staged loading: the Sun first, then the eight planets, while smaller bodies come later through a scheduler and never hold up the opening. Textures are capped at 2K.'
    - - Frames outside React
      - The scene updates Three.js objects directly every frame instead of writing to React state, so the animation doesn’t cause re-renders.
  - title: Result
    paras:
    - 'Version 1.0.0 is live on Vercel. Every production deploy waits for lint, type checks, unit tests and a cross-browser Playwright suite. What I took from it: clear rules for scale, time, data and assets keep a visual project consistent as it grows, and the version without 3D makes it useful to more people.'
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
