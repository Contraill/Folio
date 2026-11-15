---
name: Nodesk
repo: Nodesk
lang: Python
since: Oct 2026
home: https://contraill.github.io/Nodesk/
img:
  src: /assets/card_nodesk.webp
  w: 900
  h: 562
pos: 50% 0%
desc: 'A live map of a home network, remote homes, servers and a Tailscale tailnet, run from a Raspberry Pi that never scans ports: devices are learned from what they announce.'
case:
  lede: What is on each network, whether it is up and what changed, without a single port scan.
  stack: Python (standard library) · Raspberry Pi · Tailscale · OpenWrt · Docker · nginx · ntfy / Telegram
  facts:
  - - '0'
    - port scans
  - - '5'
    - minutes between agent reports
  - - '2'
    - 'agents: OpenWrt routers and Linux servers'
  sections:
  - title: Overview
    paras:
    - Nodesk is a live, single-page map of a home network, a remote home behind an OpenWrt router, cloud servers and a Tailscale tailnet. It runs on a Raspberry Pi and shows which device is where, whether it is online, which services are running and how the machines reach each other. The interface is in English and Turkish.
  - title: Why I built it
    paras:
    - The usual way to map a network is to scan every device, which is noisy and often tied to the router’s brand. I wanted a map that works with any modem, extender or router and never connects to the devices it shows.
  - title: What I built
    list:
    - - Learning by listening
      - Devices are learned from what they announce when they join (DHCP) and on the network (mDNS, SSDP), and from the Pi’s own ARP table. Devices that announce no name get one name query a day.
    - - Agents that push
      - Remote routers and servers send their own data to the Pi every five minutes with a key, and fetch new versions from it themselves. The Pi never opens a connection to them.
    - - The tailnet
      - Who reaches whom directly or through a relay (DERP), and who uses which exit node.
    - - Alerts
      - Optional ntfy or Telegram messages for new devices, services going down, silent agents and exit node changes.
    - - No dependencies
      - Python’s standard library and a single-file web interface, served by nginx in a container.
  - title: The hard part
    list:
    - - Phones that change their address
      - Phones use a different random MAC address on every Wi-Fi network, so one phone can look like several devices. Nodesk treats addresses as one device when they announce the same name (factory default names don’t count) or share a name in the config, and asks when one device disappears and another appears right after.
    - - Devices counted twice
      - A device on both cable and Wi-Fi, or an extender with two MAC addresses, could appear twice. Nodesk shows each of them once, and keeps devices behind extenders that rewrite MAC addresses apart, so they aren’t merged by mistake.
  - title: Result
    paras:
    - 'A live demo with made-up data runs on GitHub Pages. Unit, API, script and interface tests run with one command, and the map checks itself for overlapping cards and crossing lines. What I learned: a network can be mapped well by listening, without touching the devices on it.'
---
