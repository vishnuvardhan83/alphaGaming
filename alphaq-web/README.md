# AlphaQ Gaming — Web (Angular 20)

Public marketing website for AlphaQ Gaming — Indore's next-level gaming café.
Dark near-black canvas with an electric metallic-green identity, built Bootstrap-first
with a small, purposeful SCSS layer and a lazy-loaded Three.js hero.

> Source of truth: `../AlphaQ_Gaming_Website_Blueprint.pdf`, `../MASTER_AGENT_PROMPT.md`,
> `../skills/*`, and the approved brand mockups. Progress is tracked in
> `../docs/AI-PROJECT-STATE.md` and `../docs/REQUIREMENT-TRACEABILITY.md`.

## Stack
- Angular 20 (standalone components, signals, `OnPush`)
- Bootstrap 5 (layout/UI foundation) + Bootstrap Icons
- SCSS design system (`src/styles.scss`) — tokens, glass surfaces, buttons, badges
- Three.js (metallic "Q" emblem hero) — dynamically imported into its own chunk
- GSAP available for future motion work

## Run
```bash
cd alphaq-web
npm install          # already done during scaffold
npm start            # ng serve → http://localhost:4200
npm run build        # production build → dist/
npm test             # Karma/Jasmine (needs Chrome)
```

## Structure
```
src/app/
  core/content.ts              # static site content (nav, pricing, games, food…) — moves to APIs later
  shared/
    nav/                       # scroll-aware navbar + live availability strip
    footer/                    # contact, hours, social, floating WhatsApp
    reveal.directive.ts        # aqReveal — reduced-motion-aware scroll reveal
  features/home/
    home.ts / home.html        # composes all 12 landing sections
    sections/hero/             # Three.js emblem hero (+ static fallback)
```

## Design & product rules honoured
- **3D never blocks anything** — Three.js is code-split and only initialises on capable
  desktop devices; reduced-motion, small screens and no-WebGL keep the static emblem.
- **Bootstrap-first** — custom SCSS is limited to brand surfaces Bootstrap can't express.
- **No fake functionality** — nothing simulates a real booking/payment/login; prices and
  availability are clearly-marked placeholders destined for backend APIs.
- **Accessible** — semantic landmarks, keyboard-reachable hardware "hotspot" cards as the
  non-3D equivalent, visible focus, reduced-motion support.

## Not yet built (later phases — see traceability doc)
Booking engine, payments + admin approval, auth (mobile OTP), gamer dashboard, food
ordering, rewards/referrals, tournaments, admin panel — all backend (Spring Boot + MySQL).
