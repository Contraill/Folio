---
name: huepr
repo: huepr
repoId: 1185310379
lang: JavaScript
date: '2026-03-18'
since: Mar 2026
stars: 1
kind: browser
tint:
  - "#2f8f8a"
  - "#5a3d8f"
img:
  src: /assets/huepr_aurora.webp
  w: 1086
  h: 804
hero:
  src: /assets/huepr_aurora.webp
  w: 1086
  h: 804
pos: 0% 0%
desc: "Hyprland wallpaper to browser theme: injects CSS variables into allowlisted sites via Native Messaging."
topics:
  - hyprland
  - webextension
  - native-messaging
  - theming
area: theming
order: 0
case:
  lede: Change the Hyprland wallpaper and the websites you use change with it.
  stack: WebExtension (Manifest V2) · JavaScript · Python Native Messaging host · Shell installer · web-ext
  facts:
    - - "6"
      - theming features
    - - "2"
      - "browsers: Firefox and Zen"
    - - "0"
      - sites themed without your allowlist
  sections:
    - kind: overview
      title: Overview
      paras:
        - huepr is a Linux theming tool for Firefox and Zen Browser on Hyprland. When the wallpaper changes, a small native host tells the extension, which injects CSS variables into the sites you allowed.
    - title: Features
      list:
        - - Wallpaper-driven theming
          - The theme switches automatically with the wallpaper.
        - - Per-site variable mapping
          - Map a site’s own variables to theme variables.
        - - Per-site override
          - Pin a theme to one site and ignore the wallpaper.
        - - Custom CSS
          - Per-site rules for hard-coded colors.
        - - Auto-detect
          - Scan the active tab for variables worth mapping.
        - - Palette from an image
          - Seed a new theme from any picture.
    - title: Screens
      gal:
        - - src: /assets/huepr_aurora.webp
            w: 1086
            h: 804
          - GitHub themed with the Aurora palette
        - - src: /assets/huepr_latte.webp
            w: 1086
            h: 804
          - GitHub themed with the Latte palette
        - - src: /assets/huepr_hero.webp
            w: 1086
            h: 730
          - The huepr repository on GitHub
---
