---
name: Nothing KDE Theme
repo: Nothing-Kde-Theme
repoId: 1372704241
lang: QML
date: '2026-09-16'
since: Sep 2026
stars: 11
kind: img
img:
  src: /assets/card_nothing_cc.webp
  w: 700
  h: 394
hero:
  src: /assets/hero_nothing.webp
  w: 1800
  h: 1012
pos: 70% 50%
desc: "A Nothing-inspired suite for KDE Plasma 6: a top island, a dock, nineteen desktop widgets and the Glassy style."
topics:
  - kde-plasma
  - plasma6
  - kvantum
  - aurorae
area: theming
order: 2
case:
  lede: "The look of Nothing’s phones on a Linux desktop: an island at the top, a dock at the bottom, and widgets drawn in dots."
  stack: "QML · KDE Plasma 6 · Qt 6 · KDE Frameworks 6 · Kvantum · Aurorae · Python · Shell · gettext · CMake"
  facts:
    - - "19"
      - "desktop widgets"
    - - "2"
      - "languages: English and Turkish"
    - - "0"
      - "background services of its own"
  sections:
    - kind: overview
      title: "Overview"
      paras:
        - "Nothing KDE is a theme suite for KDE Plasma 6 in Nothing’s design language. It runs on Plasma’s own components, with no daemon of its own, and one script installs it, upgrades it and takes it out again."
    - title: "What it adds"
      list:
        - - "The island"
          - "Workspaces, weather, the clock, the player and live activities at the top; expanded, Wi-Fi, Bluetooth, sound, brightness, power profiles, system stats and notifications."
        - - "The dock"
          - "Meta+1 to Meta+9 open or cycle apps, the wheel cycles windows, files dropped on an icon open in it, and icons show badges and progress."
        - - "Desktop widgets"
          - "Nineteen of them, from clocks, weather and a focus timer to a glyph light that flashes on the beat and a dot-matrix pet."
        - - "Glassy"
          - "A Kvantum style and an Aurorae window decoration that follow KDE’s colours, with their own settings."
        - - "Accent links"
          - "The KDE accent colour reaches Starship, Fastfetch, libadwaita apps, Kitty and Dolphin."
        - - "Boot and sound"
          - "A Plymouth animation redrawn in the accent colour, and a sound theme synthesised from dots."
    - title: "Built to be undone"
      paras:
        - "Everything the suite changes on a system can be put back."
      list:
        - - "Installer"
          - "install.sh installs or upgrades, and backs up the old panel layout before applying its own; uninstall.sh removes everything it installed."
        - - "Accent links"
          - "Each link keeps the user’s own configuration and backs it up in ~/.config/nothing-kde/."
        - - "Notification look"
          - "Installed only when Plasma’s notification code matches what it expects; otherwise KDE’s own look stays."
        - - "Privacy buttons"
          - "The island’s camera button blocks USB cameras, and turning one back on always asks for the password."
        - - "Tests"
          - "CI renders every widget style in dark and light with real Plasma, off screen, and runs the QML and Python tests on every push."
    - title: "Credits"
      paras:
        - "The island began as Omar’s Nothing Island, several widgets are adapted from nothing-kde-widgets, and many widget styles are designs from EveryThing-UI, all under MIT. It is not an official Nothing product."
    - title: "Screens"
      gal:
        - - src: /assets/nothing_desktop.webp
            w: 1600
            h: 900
          - "The island, desktop widgets and the dock"
        - - src: /assets/nothing_island.webp
            w: 1600
            h: 900
          - "The expanded island"
---
