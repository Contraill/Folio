---
name: Nothing KDE Theme
repo: Nothing-Kde-Theme
lang: QML
since: Sep 2026
img:
  src: /assets/card_nothing_cc.webp
  w: 700
  h: 394
hero:
  src: /assets/hero_nothing.webp
  w: 1800
  h: 1012
pos: 70% 50%
desc: 'A Nothing-inspired suite for KDE Plasma 6: a top island, a dock, nineteen desktop widgets and the Glassy style, all removable with one script.'
case:
  lede: 'The look of Nothing’s phones on a Linux desktop: an island at the top, a dock at the bottom, and widgets drawn in dots.'
  stack: QML · KDE Plasma 6 · Qt 6 · KDE Frameworks 6 · Kvantum · Aurorae · Python · Shell · gettext · CMake
  facts:
  - - '19'
    - desktop widgets
  - - '2'
    - 'languages: English and Turkish'
  - - '0'
    - background services of its own
  sections:
  - title: Overview
    paras:
    - Nothing KDE is a theme suite for KDE Plasma 6 in the design language of Nothing’s phones. It is built on Plasma’s own components, runs no background service of its own, and one script installs it, upgrades it and takes it out again.
  - title: Why I built it
    paras:
    - 'The goal was Nothing’s look on my own desktop as one suite that respects the system: something that can be installed, updated and removed cleanly, instead of a pile of hand-edited settings.'
  - title: What I built
    list:
    - - The island
      - Workspaces, weather, the clock, the player and live activities at the top; expanded, it holds Wi-Fi, Bluetooth, sound, brightness, power profiles, system stats and notifications.
    - - The dock
      - Meta+1 to Meta+9 open or cycle apps, the scroll wheel cycles windows, files dropped on an icon open in that app, and icons show badges and progress.
    - - Desktop widgets
      - Nineteen of them, from clocks, weather and a focus timer to a glyph light that flashes on the beat and a dot-matrix pet.
    - - Glassy and accent links
      - A Kvantum style and an Aurorae window decoration that follow KDE’s colours, and links that carry the KDE accent colour to Starship, Fastfetch, libadwaita apps, Kitty and Dolphin.
    - - Boot and sound
      - A boot animation redrawn in the accent colour, and a sound theme synthesised from dots.
  - title: The hard part
    paras:
    - 'A theme that edits panels, configuration files and the boot screen can leave a system broken or impossible to clean up. I designed every change so it can be undone:'
    list:
    - - Backups first
      - install.sh backs up the old panel layout before applying its own, each accent link backs up the user’s own configuration in ~/.config/nothing-kde/, and uninstall.sh removes everything the suite installed.
    - - Plasma updates
      - The custom notification look depends on Plasma’s internal code, so it is installed only when that code matches what it expects; otherwise KDE’s own look stays, instead of breaking after an update.
    - - Root only where needed
      - When the accent colour changes, the boot animation is redrawn and the initramfs rebuilt in the background, through a polkit rule that allows exactly that and nothing else.
    - - Privacy buttons
      - The island’s camera button blocks USB cameras, and turning one back on always asks for the password.
  - title: Result
    paras:
    - CI renders every widget style in dark and light with real Plasma, off screen, and runs the QML and Python tests on every push; releases are published from a tag.
    - 'Credits: the island began as Omar’s Nothing Island, several widgets are adapted from nothing-kde-widgets, and many widget styles are designs from EveryThing-UI, all under MIT. It is not an official Nothing product.'
  - title: Screens
    gal:
    - - src: /assets/nothing_desktop.webp
        w: 1600
        h: 900
      - The island, desktop widgets and the dock
    - - src: /assets/nothing_island.webp
        w: 1600
        h: 900
      - The expanded island
---
