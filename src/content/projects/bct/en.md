---
name: Breast Cancer Tracker
repo: Breast-Cancer-Tracker
repoId: 1027125922
lang: Vue
date: '2025-07-27'
since: Summer 2025
stars: 0
kind: img
img:
  src: /assets/card_bct.webp
  w: 900
  h: 633
pos: 50% 0%
home: https://breastcancertracking.web.app
desc: "A Vue and Firebase screening questionnaire with an admin panel, written in a 2025 internship and later secured with Firestore rules, a server-granted admin role and emulator tests."
topics:
  - vue
  - firebase
  - firestore
  - internship-project
area: web
order: 5
case:
  lede: "A screening questionnaire that began in a three-week internship, then was rebuilt so the server, not the browser, decides who sees what."
  stack: "Vue 3 · Vue Router · PrimeVue · Vite · Firebase Auth · Cloud Firestore · Firebase Hosting · Firestore Rules · Firebase Emulator Suite · GitHub Actions"
  facts:
    - - "3"
      - "weeks of internship, 27 July to 15 August 2025"
    - - "1"
      - "place that decides access: Firestore Rules"
    - - "AA"
      - "WCAG contrast for text and buttons"
  sections:
    - kind: overview
      title: "Overview"
      paras:
        - "A participant creates an account and answers a breast-cancer screening questionnaire, and administrators review the answers in a panel. It is not a medical device: it gives no diagnosis, score or advice, and the repository holds only synthetic data."
    - title: "Built in the internship"
      list:
        - - "Accounts"
          - "Registration with consent, email verification, in-app password reset and change, and generic errors that don’t reveal who has an account."
        - - "Questionnaire"
          - "Personal details, HRT and menopause, BRCA genes, family history, allergies, smoking, vaping and alcohol, with conditional fields and live validation."
        - - "Admin panel"
          - "Search, per-user details, aggregate statistics, CSV export and a switch for registration."
        - - "Mobile"
          - "Layout, date picker and choice controls tuned for touch screens."
    - title: "Secured afterwards"
      paras:
        - "The internship version decided admin rights in the browser. The follow-up work moved every decision to the server without redesigning the interface."
      list:
        - - "Firestore Rules"
          - "A user reads and writes only their own record, whose shape is checked; admins can read records but not change anyone’s answers."
        - - "Admin role"
          - "The first admin can only be created with the Admin SDK, outside the browser, and an admin can’t revoke themselves."
        - - "No way up from the browser"
          - "The hard-coded admin list, the environment switches and the emergency admin mode are gone."
        - - "Emulator tests"
          - "Rule and smoke tests run against the Firebase Emulator with a demo project that can never reach a real one."
        - - "Deploy gates"
          - "Hosting deploys wait for the tests, and rules can’t be deployed while their tests fail."
    - title: "A calmer interface"
      paras:
        - "The interface moved from the default blue and green to a soft rose palette held in one set of tokens, darkened where needed to pass WCAG AA, with a visible focus outline on every control."
    - title: "Screens"
      gal:
        - - src: /assets/bct_form.webp
            w: 1280
            h: 900
          - "The questionnaire"
        - - src: /assets/bct_signin.webp
            w: 1280
            h: 900
          - "Sign in"
        - - src: /assets/bct_admin.webp
            w: 1280
            h: 900
          - "The admin panel, with synthetic accounts"
---
