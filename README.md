# Resilient Wealth Group — CRM

A high-end internal CRM for tracking agent outreach to **FRS seminar leads** —
calls, reaches, appointments — from the moment a list is uploaded until an
appointment is kept and an opportunity is uncovered (then the lead graduates to
the compliance-approved CRM).

> **Wealth, Conducted with Purpose.**

---

## ▶️ How to open it (prototype)

Just **double-click `index.html`** — it runs entirely in your browser, no server
or install needed.

**Demo logins** (on the gate screen, "Demo quick-login"):
- **Owner / Admin** — Carlos (full visibility, upload & assign, settings)
- **Agent** — Maria Santos (board, leads, today's queue, personal stats)

The prototype uses **sample data saved in your browser**. Anything you do
(logging calls, setting appointments, importing a CSV) persists across refreshes.
Reset it any time from **Settings → Reset demo data**.

---

## 🧭 What's built (Phase 1 — clickable prototype)

**Login gate** — sign in, request-access (owner-approval), demo quick-login.

**Agent cockpit**
- **My Board** — Monday-style Kanban by pipeline stage, cards sorted best-first
- **My Leads** — sortable table with quality scores
- **Today's Queue** — upcoming appointments, callbacks, fresh leads to work
- **My Stats** — weekly dials/reaches/appointments, personal funnel & tier mix
- **Lead drawer** — full FRS profile, "why this score", one-click activity
  logging (Call/Text/Email/Voicemail), and pipeline actions
  (Set Appointment → Appointment Kept → Opportunity Opened / No Opportunity)

**Admin command center**
- Weekly **goal ring** (10–15 new appointments), live activity stats
- **Team funnel**, **lead-quality mix**, **agent leaderboard**
- **All Leads** with tier filters + search
- **Team** — approve/deny pending agents, per-agent performance
- **Upload & Assign** — drop a CSV, columns auto-mapped, every lead auto-scored,
  preview, then assign to an agent
- **Scoring & Settings** — tune every threshold of the lead-quality engine

**Lead-quality engine** — auto-tiers each lead **GOLD / High / Medium / Low**
from YOS, plan type, age 59½, DROP eligibility (Regular vs Special Risk), and
AFC, with a plain-English reason for every score.

---

## 🗂️ Project structure

```
CRM/
├─ index.html              App entry point (loads everything)
├─ README.md
└─ assets/
   ├─ img/logo.png         RWG logo
   ├─ css/styles.css       Design system (RWG brand: navy/gold, Fraunces+Hanken)
   └─ js/
      ├─ scoring.js        Lead-quality scoring engine (editable rules)
      ├─ data.js           Data layer + sample data  ← swaps to Firebase in Phase 5
      ├─ auth.js           Auth/session             ← swaps to Firebase Auth
      ├─ ui.js             Formatting + reusable HTML bits
      ├─ analytics.js      Funnel, weekly stats, goal, leaderboard
      ├─ app.js            Controller: routing + all interactions
      └─ views/
         ├─ login.js       Sign-in / request-access gate
         ├─ drawer.js      Lead detail + activity logging (shared)
         ├─ agent.js       Agent cockpit views
         └─ admin.js       Admin command-center views
```

`data.js` and `auth.js` are the **only** files that know where data lives. In
Phase 5 their internals are replaced with Firebase; the rest of the app is
untouched.

---

## 🛣️ Roadmap

| Phase | Scope | Status |
|------:|-------|--------|
| 1 | Branded UI + login + agent cockpit + admin center + scoring (sample data) | ✅ **Done** |
| 2 | Firebase project setup (Auth + Firestore) — guided, ~15 min | ⏳ Next |
| 3 | Wire real auth (owner-approval) + roles | ⏳ |
| 4 | Live Firestore data (leads, activities, assignment) | ⏳ |
| 5 | Google Sheet mirror + deploy to GitHub Pages | ⏳ |

---

*Prototype. Sample data only. No real client/financial information is stored.*
