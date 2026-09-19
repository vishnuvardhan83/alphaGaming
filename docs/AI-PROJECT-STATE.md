# AlphaQ Gaming — AI Project State (Continuity Ledger)

> Single source of truth for what has been built, verified, and what comes next.
> Update this after **every** task. Never mark `COMPLETED` before verification passes.

## Project snapshot

| Field | Value |
|---|---|
| Product | AlphaQ Gaming — gaming-café platform (Indore, MP, India) |
| Sources of truth | `AlphaQ_Gaming_Website_Blueprint.pdf` (v1.0), `MASTER_AGENT_PROMPT.md`, `skills/*`, approved brand mockups (WhatsApp refs) |
| Stack (frontend) | Angular 20 (standalone, signals), Bootstrap 5, SCSS (minimal), Three.js, GSAP |
| Stack (backend) | Java 21, Spring Boot 3.x, Spring Security, JPA/Hibernate, Flyway, MySQL 8+ *(not started)* |
| Brand direction | Dark near-black canvas, **electric metallic green** accent (approved mockup overrides the older violet/cyan prompt text) |
| Repo layout | `alphaq-web/` (Angular), `docs/` (ledgers), `backend/` *(future)* |

## Decision log

- **2026-09-19** — Brand accent set to **electric green** on charcoal/near-black, per the approved WhatsApp hero mockups and the blueprint note "final colours should be derived from the approved identity." The master-prompt "violet/cyan" text is treated as superseded. Light mode deferred (blueprint calls for it, but launch scope is dark-first).
- **2026-09-19** — Scope for the current pass (user-approved): **Foundation + flagship landing page only.** No backend yet; no other routed pages yet. Extend after visual approval.
- **2026-09-19** — Booking/payment/admin backend intentionally deferred to a later phase (blueprint Phase 1 continues after the public site).

## Task ledger

### T-001 — Frontend foundation + design system + flagship landing page
- **Feature:** Public marketing website (landing page) in the approved green aesthetic.
- **Goal:** Angular 20 workspace, SCSS design system, reusable UI kit, Three.js hero, all 12 landing sections from the blueprint (§02 landing sequence), responsive + accessible.
- **Dependencies:** none (greenfield).
- **Files created:** `alphaq-web/*` (see git), `docs/*`.
- **APIs added/changed:** none (static content; prices shown match blueprint §04 and are marked to move to backend config).
- **DB migrations:** none.
- **UI completed:** navigation, 3D hero, interactive battlestation, PC/PS5 pricing, why-AlphaQ, games, PS5 lounge, food, birthdays, tournaments, gallery/reviews, map/footer.
- **Backend completed:** n/a this task.
- **Integration completed:** n/a (mock/static content, clearly isolated — see `DATA NOTE` below).
- **Tests added / executed:** `ng build --configuration production` → **passes** (only a cosmetic Bootstrap `@import` deprecation warning). Verified rendered output via headless-Chrome screenshots at 1440px (desktop) and 375/390px (mobile). Component unit tests: pending in a later task.
- **Verification evidence:** desktop hero matches the approved mockup (dark canvas, availability strip, tall condensed headline, metallic green Q, CTAs); all 12 sections render; mobile collapses nav to hamburger, stacks CTAs, and correctly skips the heavy 3D (static emblem fallback). Three.js is confirmed code-split into its own lazy chunk (`three-module` + `RoomEnvironment`), so it never blocks initial load.
- **Known issues:** content is placeholder pending real assets (hardware specs, photos, menu, address, social links) per blueprint §12 "Content assets required"; prices are hard-shown in UI and MUST move to backend once the API exists; availability strip value is illustrative, not live.
- **Regression checks:** none applicable (first task).
- **Status:** `COMPLETED` (visual direction pending user sign-off before roll-out to other routes).
- **Next recommended task:** T-002 — extend the design system into the remaining public routes (Setups, Games, Pricing, Tournaments, Food & Drinks, Birthdays & Groups, Rewards, Visit Us, Login/Register shells), reusing `Nav`/`Footer`/UI kit. Then T-003 — scaffold the Spring Boot modular monolith + Flyway/MySQL and wire the first real vertical (setups → pricing → availability).

### T-002 — Backend foundation + Auth (Batch 1)
- **Feature:** Spring Boot backend + full authentication (register/login with mobile OTP + optional email, JWT, password reset).
- **Goal:** Working auth end-to-end, verified by running (no tests — per user).
- **Dependencies:** local database. Chosen: **Docker MySQL 8.4 on host port 3307** (`backend/docker-compose.yml`) after local-root MySQL was password-locked.
- **Stack:** Java 21 (build/run with `openjdk@21`; JDK 25 present but avoided), Spring Boot 3.4.1, Spring Security, Data JPA, Flyway, Bean Validation, jjwt 0.12.6.
- **Files created:** `backend/**` (pom, application.yml, docker-compose, `.env.example`, Flyway `V1__auth_schema.sql`, packages `auth`, `common`, `config`); Angular `core/auth/*`, `features/auth/{login,register,forgot-password,auth-shell}`, auth-aware `Nav`.
- **APIs added:** `POST /api/auth/register/request-otp`, `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/forgot-password/request-otp`, `POST /api/auth/reset-password`, `GET /api/auth/me`.
- **DB migrations:** V1 — `roles` (seeded OWNER/ADMIN/STAFF/CUSTOMER), `users`, `user_roles`, `otp_request`, `audit_log`.
- **Security:** BCrypt passwords, hashed single-use OTP with expiry/attempt/resend/hourly limits, stateless JWT (HS256) bearer, CORS locked to `http://localhost:4200`, CSRF disabled (stateless), global error handler (no stack traces), audit log on register/login/reset. Backend is the security boundary; Angular guards later.
- **Provider abstractions:** `OtpProvider` + `MockOtpProvider` (logs code to console; clearly a mock, swappable).
- **Verification (by running):** curl flow all green — request-OTP → register → `/me` → login (username & mobile) → wrong-password 401 → reset-via-OTP → login new pw 200 / old pw 401 → duplicate-mobile 409 → bad-mobile 400 → wrong-OTP 400; `audit_log` rows confirmed in MySQL; CORS preflight from :4200 returns proper headers; login/register pages render on-brand (screenshots).
- **Known issues:** OTP delivery is a console mock (no real SMS); email is captured but not yet verified (no SMTP yet); no Angular route guard / token-refresh / logout-on-401 interceptor yet; no `/logout` server call (JWT is stateless — client just drops the token).
- **Status:** `COMPLETED`
- **Next recommended task (Batch 2 — pending user approval):** setups/games/pricing catalogue + live availability (backend + public pages), then the booking engine with the pending-approval gate.

### T-003 — Catalogue + availability + booking (Batch 2)
- **Feature:** DB-driven pricing/games/setups, live availability engine, and the booking flow (hold → pay → pending approval).
- **Migrations:** V2 (`pricing`, `game`, `gaming_setup` seeded: 10 PC + 3 PS5, real prices), V3 (`booking`).
- **APIs added:** `GET /api/public/pricing|games|setups`, `GET /api/public/availability(&/day)`, `POST /api/bookings`, `POST /api/bookings/{ref}/pay`, `POST /api/bookings/{ref}/cancel`, `GET /api/bookings(/{ref})`.
- **Booking invariants enforced:** overlap prevention (SUM-of-quantity over overlapping active bookings, re-checked inside the create transaction), 10-minute payment hold, expired holds excluded from availability + swept to EXPIRED by `BookingExpiryJob` (`@Scheduled`), payment success → PENDING_APPROVAL (never auto-confirm), Monday closure, 11:00–20:00 window, 7-day booking window, PS5 ≤ 4 players, day-pass blocks the full day. Prices read from DB (never hardcoded).
- **Frontend:** landing pricing + games now load from the API (loading/error/empty states; hardcoded arrays removed); `/book` route behind `authGuard` (redirects to `/login?returnUrl`); booking page = configure (live availability + price) → mock pay (hold countdown) → confirmation (pending approval).
- **Security refinement:** unauthenticated protected requests now return **401** (was 403) so the SPA can redirect to login.
- **Verification (by running):** curl proved availability math (10→8 on a 2-setup hold, overlap detected, non-overlap free), overbook→409, unauth→401/403, day-pass ₹600, Monday→400, pay→PENDING_APPROVAL, audit rows. Full **browser E2E** (puppeteer-core, since removed to keep the repo test-free) drove register→book PS5→pay→"Pending admin approval" (ref AQ-LDTY3G) with screenshots.
- **Bug fixed during verification:** booking date used `toISOString()` (UTC) → off-by-one in IST (could land on closed Monday); switched to local date formatting.
- **Known issues / not yet done:** no admin approval UI yet (bookings sit in PENDING_APPROVAL — needs the admin panel to advance to CONFIRMED); real payment gateway still mock; no gamer dashboard/"my bookings" page yet (API exists); availability strip in nav/hero still illustrative (not wired to `/api/public/availability/day`).
- **Status:** `COMPLETED`
- **Next recommended (Batch 3 — pending approval):** admin panel (approve/reject bookings, assign setups, maintenance) + gamer dashboard ("my bookings", cancel) + wire the live availability strip.

### T-004 — Admin approval + gamer dashboard (Batch 3)
- **Feature:** Closes the booking loop — admins approve/reject bookings and assign physical setups; customers see their bookings; live availability strip.
- **Migration:** V4 (`booking_setup` assignment join + `decided_by/at/reason` columns).
- **Admin bootstrap:** `AdminSeeder` (CommandLineRunner) creates an OWNER on startup (env-overridable; dev default `owner` / `Owner@12345`). Path-based RBAC: `/api/admin/**` requires OWNER/ADMIN.
- **APIs added:** `GET /api/admin/bookings`, `GET /api/admin/bookings/{ref}/assignable-setups`, `POST .../approve`, `POST .../reject`, `GET /api/admin/setups`, `POST /api/admin/setups/{code}/status`.
- **Rules enforced:** approve requires exactly `quantity` free setups from the assignable set (setup free = AVAILABLE + not assigned to an overlapping active booking); approve → CONFIRMED + assignment + audit; reject → REJECTED + reason + audit; maintenance toggle removes a setup from availability (verified 10→9).
- **Frontend:** `adminGuard`/`authGuard`; admin console (`/admin`) with bookings queue (status filter, inline approve setup-picker, reject-with-reason) + setups maintenance grid; gamer dashboard (`/dashboard`, my bookings + cancel, shows assigned setups + decision reason); nav gains Admin/Dashboard links; live availability strip in nav + hero now fetches `/api/public/availability/day` (replaced static counts).
- **Verification (by running):** curl proved owner login/RBAC (non-admin blocked), approve→CONFIRMED+PC-01/PC-02, reject+reason, maintenance→capacity drop. Browser E2E (puppeteer-core, since removed) confirmed: live strip shows real "10 of 10 / 3 of 3", admin approved AQ-GQMXPR via the setup-picker, and it appeared **confirmed with PC-01, PC-02 on the customer's dashboard** — full loop closed.
- **Known issues / not yet done:** no real notifications on approve/reject (still just audit); no reschedule; refund on reject not modelled (status only); no admin dashboard summary/reporting; food/rewards/tournaments still unbuilt.
- **Status:** `COMPLETED`
- **Next recommended (Batch 4 — pending approval):** notifications abstraction (mock → email/WhatsApp) wired to booking events, OR food ordering, OR rewards/referrals.

## DATA NOTE (anti-fake-functionality rule, master prompt §18)

All content on the landing page is **static placeholder** or **isolated mock data**. Nothing here simulates a real booking, payment, login, or notification. When the backend exists:
- Prices/availability move to `PricingService` / `AvailabilityService` → REST → Spring → MySQL.
- The availability strip ("6 of 10 PCs available") becomes a live API call; it is currently a clearly-labelled illustrative value.

## Statuses legend
`NOT_STARTED` · `IN_PROGRESS` · `BLOCKED` · `COMPLETED` · `NEEDS_REVIEW`
