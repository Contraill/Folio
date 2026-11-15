---
name: Breast Cancer Tracker
repo: Breast-Cancer-Tracker
lang: Vue
since: Summer 2025
home: https://breastcancertracking.web.app
img:
  src: /assets/card_bct.webp
  w: 900
  h: 633
pos: 50% 0%
desc: A Vue and Firebase screening questionnaire with an admin panel. I wrote it in a 2025 internship and later secured it with Firestore rules, a server-granted admin role and emulator tests.
case:
  lede: A screening questionnaire that began in a three-week internship, then was rebuilt so that the server, not the browser, decides who sees what.
  stack: Vue 3 · Vue Router · PrimeVue · Vite · Firebase Auth · Cloud Firestore · Firebase Hosting · Firestore Rules · Firebase Emulator Suite · GitHub Actions
  facts:
  - - '3'
    - weeks of internship, 27 July to 15 August 2025
  - - '1'
    - 'place that decides access: Firestore Rules'
  - - AA
    - WCAG contrast for text and buttons
  sections:
  - title: Overview
    paras:
    - 'A participant creates an account and answers a breast-cancer screening questionnaire, and administrators review the answers in a panel. It is not a medical device: it gives no diagnosis, score or advice, and the repository holds only synthetic data.'
  - title: Why I built it
    paras:
    - 'It began in my summer 2025 internship: the company asked me to build my own version, inspired by one of their projects, and contributed no code. After the internship I kept working on it, because the internship version decided admin rights in the browser.'
  - title: What I built in the internship
    list:
    - - Accounts
      - Registration with consent, email verification, in-app password reset and change, and generic error messages that don’t reveal who has an account.
    - - Questionnaire
      - Personal details, HRT and menopause, BRCA genes, family history, allergies, smoking, vaping and alcohol, with conditional fields and live validation.
    - - Admin panel
      - Search, per-user details, aggregate statistics, CSV export and a switch for registration.
    - - Deploys
      - GitHub Actions deploy to Firebase Hosting on every merge and open a preview channel for each pull request.
  - title: The hard part
    paras:
    - 'In the internship version, admin rights were decided in the browser: a hard-coded email list, environment switches and an emergency mode that made the first visitor an admin. Since anyone can change the code running in their browser, that was a privilege escalation risk. I moved every decision to the server without redesigning the interface:'
    list:
    - - Firestore Rules
      - A user reads and writes only their own record, and its shape is checked; admins can read records but can’t change anyone’s answers.
    - - Admin role
      - The first admin can only be created with the Admin SDK, outside the browser, and an admin can’t revoke themselves.
    - - The browser only displays
      - The hard-coded list, the switches and the emergency mode are gone. Checks in the browser now only decide what the interface shows; the rules make the real decision.
    - - Emulator tests
      - Rule and smoke tests run against the Firebase Emulator with a demo project that can never reach a real one.
    - - Deploy gates
      - Hosting deploys wait for the tests, and rules can’t be deployed while their tests fail.
  - title: Result
    paras:
    - 'For users the app works the same, but the server now decides who sees what. Afterwards the interface moved from the default blue and green to a soft rose palette held in one set of tokens, darkened where needed to pass WCAG AA. The lesson: hiding something in the interface isn’t security; the rules on the server are.'
  - title: Screens
    gal:
    - - src: /assets/bct_form.webp
        w: 1280
        h: 900
      - The questionnaire
    - - src: /assets/bct_signin.webp
        w: 1280
        h: 900
      - Sign in
    - - src: /assets/bct_admin.webp
        w: 1280
        h: 900
      - The admin panel, with synthetic accounts
---
