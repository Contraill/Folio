---
name: huepr
repo: huepr
lang: JavaScript
since: Mar 2026
img:
  src: /assets/huepr_aurora.webp
  w: 1086
  h: 804
hero:
  src: /assets/huepr_aurora.webp
  w: 1086
  h: 804
pos: 0% 0%
desc: 'Restyles the websites you allow with each Hyprland wallpaper: a native helper hears the change and the extension swaps their CSS variables.'
case:
  lede: Change the Hyprland wallpaper and the websites you use change with it.
  stack: WebExtension (Manifest V2) · JavaScript · Python Native Messaging host · Shell installer · web-ext
  facts:
  - - '6'
    - theming features
  - - '2'
    - 'browsers: Firefox and Zen'
  - - '0'
    - sites themed without your permission
  sections:
  - title: Overview
    paras:
    - huepr is a Firefox and Zen Browser extension with a small native helper, for Linux on Hyprland. When the wallpaper changes, the helper tells the extension, which sets new CSS variables on the sites you allowed, without reloading them.
  - title: Why I built it
    paras:
    - On my Hyprland setup the desktop’s colours change with each wallpaper, but the websites I use stayed the same. huepr carries the wallpaper’s theme into the sites you choose.
  - title: What I built
    list:
    - - Themes by wallpaper
      - Each wallpaper’s name picks a theme, and the theme switches automatically with a short transition.
    - - Per-site mapping
      - Map a site’s own CSS variables to the theme’s, or pin one theme to a site and ignore the wallpaper.
    - - Custom CSS
      - Per-site rules for colours that sites hard-code.
    - - Auto-detect and palettes
      - Scan the active tab for variables worth mapping, and seed a new theme from any picture.
  - title: The hard part
    list:
    - - A browser can’t see the wallpaper
      - Extensions have no access to the desktop. A wallpaper hook writes the new path to a named pipe; a small Python helper, started by the browser, reads it and passes the name to the extension over Native Messaging. The extension then updates every allowed tab.
    - - No site by default
      - 'Before version 2.1 the extension asked for access to every website. Now it starts with access to none: you grant each site, and the script that sets the colours runs only there. It makes no network requests and sends no page content anywhere.'
    - - Signed, not forced
      - Early installers turned off Firefox’s signature check to load the extension. Now the extension is signed through addons.mozilla.org, and the installer removes the old setting.
  - title: Result
    paras:
    - 'huepr is published on Firefox Add-ons and updates from there, and its uninstaller reverses every change it made to the system. Limits: it runs on Linux only, Chromium browsers aren’t supported, and sites without CSS variables need custom rules.'
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
