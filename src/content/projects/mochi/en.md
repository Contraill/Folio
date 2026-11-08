---
name: Mochi
repo: mochi
repoId: 1430944449
lang: C++
date: '2026-10-23'
since: Oct 2026
stars: 0
kind: pixel
tint:
  - "#8a5a3c"
  - "#2f3d5c"
desc: Animated OLED desk companion on ESP32-C3 that reacts to touch, petting and shaking.
topics:
  - esp32-c3
  - arduino
  - oled
  - desk-companion
area: hardware
order: 6
case:
  lede: A small animated face on a 128×64 OLED that notices when you touch it, pet it or pick it up.
  stack: ESP32-C3 SuperMini · Arduino (C++) · U8g2 · ArduinoJson · LittleFS · Python + Pillow tooling · pytest · Playwright
  facts:
    - - "53"
      - animated faces
    - - ≈820 KB
      - for all of them, in MOC3
    - - 128×64
      - pixels of SH1106 OLED
  sections:
    - kind: overview
      title: Overview
      paras:
        - Mochi is a desk companion built around an ESP32-C3, a 1.3" SH1106 OLED, a touch sensor and an accelerometer. It runs on a single-cell LiPo and has a web panel for everything you would otherwise need a cable for.
    - title: What it does
      list:
        - - 53 animated faces
          - Compressed to about 820 KB in total.
        - - Touch reactions
          - Poke, petting and deep petting.
        - - Motion reactions
          - Soft and hard shake, acceleration, free-fall, tilt, pick-up.
        - - Web panel
          - "English or Turkish: face gallery, uploads, reaction mapping, settings, config import/export."
        - - Power aware
          - Battery level, low-battery warnings, charging indicator and light, deep and hybrid sleep.
        - - Own animation format
          - MOC3 (delta + RLE) with a GIF converter.
    - title: Hardware
      list:
        - - ESP32-C3 SuperMini
          - 4 MB flash.
        - - SH1106 OLED
          - 1.3", SPI, 128×64.
        - - TTP223
          - Capacitive touch sensor.
        - - MMA8452Q
          - Accelerometer over I²C.
        - - LiPo + TP4056
          - Single cell with charger board and a divider for battery measurement.
---
