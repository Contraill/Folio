---
name: CampusEats
repo: CampusEats
repoId: 1263361824
lang: JavaScript
date: '2026-06-08'
since: Jun 2026
stars: 0
kind: img
img:
  src: /assets/card_campus.webp
  w: 900
  h: 562
pos: 0% 0%
desc: "QR ordering for a campus restaurant, run on one machine: guests order from their table by phone, and managers follow orders, tables and payments live. An individual graduation project."
topics:
  - react
  - express
  - socket-io
  - sqlite
area: web
order: 4
case:
  lede: "Scan the code on the table, order from your phone, and follow the order from the kitchen to the table."
  stack: "React 19 · Vite · PWA · Node.js · Express · Socket.IO · SQLite (better-sqlite3) · JWT · node:test"
  facts:
    - - "3"
      - "roles: customer, manager and admin"
    - - "1"
      - "machine and one database file"
    - - "0"
      - "real payments: card and IBAN are simulated"
  sections:
    - kind: overview
      title: "Overview"
      paras:
        - "CampusEats is an individual graduation project at Eastern Mediterranean University, for cafeterias where people wait at peak hours for a menu, an order and the bill. Each table’s fixed QR code opens the menu on the customer’s phone, and the staff work from one live panel, all on one machine."
    - title: "Three roles"
      list:
        - - "Customer"
          - "Opens the menu from the table’s code, orders with notes, follows each order live, cancels while it is pending and calls a waiter."
        - - "Manager"
          - "Today’s orders grouped by table with bulk status changes, the tables and their QR codes, the menu, and a dashboard of revenue and best sellers."
        - - "Admin"
          - "Creates restaurants and their manager accounts."
    - title: "Live, and only for the right people"
      paras:
        - "Every change goes through the REST API; Socket.IO only pushes updates."
      list:
        - - "Tokens"
          - "Manager and admin routes need a JWT, and the user’s role and restaurant are read from the database on every request."
        - - "Rooms"
          - "A manager can join only their own restaurant’s room. A customer joins only their own order’s room, with the order’s random id as the key, and receives only what the order screen needs."
        - - "Secret"
          - "Behind a public address or in production, the server refuses to start without a strong secret."
        - - "Table sessions"
          - "Approving the payment clears the table’s session, so the same QR code serves the next customer."
        - - "Tests"
          - "Node’s test runner on an in-memory database covers authorization, rooms, the order flow and payments, on Node 20, 22 and 24 in CI."
    - title: "Limits"
      paras:
        - "There is no payment provider: card and IBAN payments are approved automatically to stand in for one, and cash waits for a manager. The frontend has no automated interface tests."
    - title: "Screens"
      gal:
        - - src: /assets/campus_orders.webp
            w: 1440
            h: 900
          - "Manager panel: today’s orders by table"
        - - src: /assets/campus_admin.webp
            w: 1440
            h: 900
          - "Admin panel: restaurants and manager accounts"
        - - src: /assets/campus_tables.webp
            w: 1440
            h: 900
          - "Tables and their fixed QR codes"
---
