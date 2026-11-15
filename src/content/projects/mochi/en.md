---
name: Mochi
repo: mochi
lang: C++
since: Oct 2026
desc: An ESP32-C3 desk companion with 53 animated faces on a small OLED. It reacts to pokes, petting and shakes, and is set up from a web panel on your phone.
case:
  lede: A small animated face on a 128×64 OLED that notices when you touch it, pet it or pick it up.
  stack: ESP32-C3 SuperMini · Arduino (C++) · U8g2 · ArduinoJson · LittleFS · Python + Pillow tooling · pytest · Playwright
  facts:
  - - '53'
    - animated faces
  - - ≈820 KB
    - for all of them, in my own MOC3 format
  - - 128×64
    - pixels of SH1106 OLED
  sections:
  - title: Overview
    paras:
    - Mochi is a desk companion built around an ESP32-C3, a 1.3-inch SH1106 OLED, a capacitive touch sensor and an accelerometer, powered by a single-cell LiPo. Faces, reactions and settings are managed from a web panel in English or Turkish that you open on your phone.
  - title: Why I built it
    paras:
    - 'The goal was a small device that feels alive: it should react to touch and movement, run on a battery, and be set up from a phone instead of a cable.'
  - title: What I built
    list:
    - - Firmware
      - Arduino C++ for the faces, the touch and motion reactions, random idle animations that avoid recent repeats, and light, deep and hybrid sleep.
    - - Reactions
      - Poke, petting and deep petting from the touch sensor; soft and hard shakes, acceleration, free-fall, tilt and pick-up from the accelerometer.
    - - Web panel
      - Face gallery and uploads, reaction mapping, settings and config import/export, served by the device over its own Wi-Fi access point.
    - - Tools
      - A Python GIF converter that writes my own animation format and checks every file it writes by decoding it again.
  - title: The hard part
    list:
    - - 53 faces in a small flash
      - 'Stored raw, the faces would take about 2.3 MB of the 2.4 MB file system. I designed a format called MOC3: each frame is XORed with the previous one, so unchanged pixels become zeros, and the result is run-length encoded. All 53 now take about 820 KB, 36% of their raw size. Frames are decoded once when a face loads, so playback costs no CPU; the trade-off is that RAM, not storage, limits how long an animation can be.'
    - - A sensor the board stopped reading
      - On the prototype, the pin’s digital input no longer saw the touch sensor’s 2.9 V as high. I read the sensor through the ADC instead, with hysteresis and debouncing; this works on healthy boards too.
    - - Gestures that overlap
      - Ten quick taps turn Wi-Fi on and five show the battery level, so the first five taps of the Wi-Fi gesture also match the battery gesture. The battery gesture waits for a short pause, Wi-Fi wins when both match, and the tap that completes a gesture doesn’t also count as a poke.
    - - A loose wire
      - If an accelerometer interrupt fires more than 30 times a second, as it does with a loose wire, the firmware switches to polling so the rest of the device stays responsive.
  - title: Result
    paras:
    - In CI, both firmware builds are compiled and checked against the partition size, the converter and every bundled face are tested, the English and Turkish builds are checked to stay in sync, and both web panels run in a headless browser against a mock device. Building it taught me to plan for hardware that misbehaves, not only for the board on the datasheet.
---
