---
name: CampusEats
repo: CampusEats
lang: JavaScript
since: Jun 2026
img:
  src: /assets/card_campus.webp
  w: 900
  h: 562
pos: 0% 0%
desc: 'QR ordering for a campus restaurant, running on one machine: guests order from their table by phone, and staff follow orders, tables and payments live. My individual graduation project.'
case:
  lede: Scan the code on the table, order from your phone, and follow the order from the kitchen to the table.
  stack: React 19 · Vite · PWA · Node.js · Express · Socket.IO · SQLite (better-sqlite3) · JWT · node:test
  facts:
  - - '3'
    - 'roles: customer, manager and admin'
  - - '1'
    - machine and one database file
  - - '0'
    - 'real payments: card and IBAN are simulated'
  sections:
  - title: Overview
    paras:
    - CampusEats is a QR ordering system for cafeterias. A fixed QR code on each table opens the menu on the customer’s phone, and the staff manage orders, tables, the menu and payments from one live panel. It all runs on a single machine with one SQLite file.
  - title: Why I built it
    paras:
    - 'Campus cafeterias get crowded at peak hours: people wait for a menu, wait to order and wait for the bill, while staff track orders on paper. I built CampusEats to remove those waits, as my individual graduation project at Eastern Mediterranean University.'
  - title: What I built
    list:
    - - Customer app
      - 'A mobile web app (PWA) that opens from the table’s code: a cart with notes, several orders per table, live status, cancelling while an order is pending, and calling a waiter.'
    - - Manager panel
      - Today’s orders grouped by table with bulk status changes, the tables and their QR codes, the menu, and a dashboard of revenue and best sellers.
    - - Admin panel
      - Creates restaurants and their manager accounts.
    - - One path for changes
      - Every change goes through the REST API, and Socket.IO only pushes updates. Authorization therefore lives in one place instead of two.
  - title: The hard part
    paras:
    - Live updates make it easy to send data to the wrong person, so I decided who may receive what before building the features.
    list:
    - - Rooms
      - A manager can join only their own restaurant’s room, and the JWT is checked at the handshake. Customers have no account, so the order’s random id works as the key to its room, and they receive only the fields the order screen needs.
    - - Roles that change
      - A token alone would keep working after a manager was deleted or moved to another restaurant. The server reads the user’s role and restaurant from the database on every request, so such changes apply immediately.
    - - A safe secret
      - The local demo needs no setup, but in production or behind a public address the server refuses to start without a strong JWT secret.
    - - One code for every guest
      - Tables keep the same printed QR code. Approving the payment clears the table’s session, so the next customer starts fresh.
  - title: Result
    paras:
    - 'Node’s test runner covers authorization, rooms, the order flow and payments on an in-memory database, on Node 20, 22 and 24 in CI. There is no payment provider: card and IBAN payments are approved automatically to stand in for one, and cash waits for a manager. The interface has no automated tests yet.'
  - title: Screens
    gal:
    - - src: /assets/campus_orders.webp
        w: 1440
        h: 900
      - 'Manager panel: today’s orders by table'
    - - src: /assets/campus_admin.webp
        w: 1440
        h: 900
      - 'Admin panel: restaurants and manager accounts'
    - - src: /assets/campus_tables.webp
        w: 1440
        h: 900
      - Tables and their fixed QR codes
---
