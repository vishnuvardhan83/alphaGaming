# AlphaQ Gaming — Requirement Traceability

Maps each blueprint requirement → frontend → backend → database → API → tests → status.
Prevents features from being "visually complete but technically disconnected."

Legend: ✅ done · 🟡 partial/placeholder · ⬜ not started · n/a not applicable this phase

## Public website (blueprint §02, §03)

| Requirement | Frontend | Backend | DB | API | Tests | Status |
|---|---|---|---|---|---|---|
| Landing hero + value prop + CTAs | ✅ hero section | ⬜ | ⬜ | ⬜ | 🟡 build | 🟡 |
| Live availability strip ("6 of 10 PCs…") | 🟡 static (nav) | ✅ AvailabilityService | ✅ setups/bookings | ✅ `/api/public/availability` | ✅ run | 🟡 (engine live; nav strip not yet wired) |
| Interactive 3D battlestation + hotspots | ✅ Three.js hero + hotspots | n/a | n/a | n/a | ⬜ | 🟡 |
| PC & PS5 pricing display | ✅ from API | ✅ CatalogueService | ✅ pricing table | ✅ `/api/public/pricing` | ✅ run | ✅ |
| Booking engine (overlap-safe, hold, approval gate) | ✅ /book flow | ✅ BookingService | ✅ booking table | ✅ `/api/bookings*` | ✅ run+E2E | ✅ (customer side; admin approval pending) |
| Why AlphaQ (proof points) | ✅ | n/a | n/a | n/a | ⬜ | 🟡 |
| Ready-to-play games (filterable) | ✅ from API | ✅ CatalogueService | ✅ game table | ✅ `/api/public/games` | ✅ run | ✅ |
| PS5 lounge messaging | ✅ | n/a | n/a | n/a | ⬜ | 🟡 |
| Food & drinks preview + order entry | 🟡 preview | ⬜ FoodService | ⬜ food_item/category | ⬜ `/api/food` | ⬜ | 🟡 |
| Birthdays & groups enquiry entry | 🟡 CTA | ⬜ EventService | ⬜ event/enquiry | ⬜ `/api/enquiries` | ⬜ | 🟡 |
| Tournaments preview + leaderboard | 🟡 preview | ⬜ TournamentService | ⬜ tournament/team | ⬜ `/api/tournaments` | ⬜ | 🟡 |
| Gallery & verified reviews | 🟡 preview | ⬜ ReviewService | ⬜ gallery/review | ⬜ `/api/reviews` | ⬜ | 🟡 |
| Map, location & footer | ✅ (map embed placeholder) | n/a | ⬜ content settings | ⬜ | ⬜ | 🟡 |

## Core platform (deferred to later phases — tracked so nothing is forgotten)

| Requirement | Status | Notes |
|---|---|---|
| Booking engine + overlap prevention (§05, §08 of prompt) | ⬜ | invariants captured in blueprint §05 |
| Payment abstraction + admin approval gate (§04 prompt) | ⬜ | payment success ≠ confirmation |
| Auth (mobile OTP → username/password), roles OWNER/ADMIN/STAFF/CUSTOMER | 🟡 | **Done (Batch 1):** register/login/reset via mobile OTP + optional email, JWT, BCrypt, audit, roles seeded. Verified by running (curl + UI). Remaining: real SMS/SMTP, Angular route guards, email verification |
| Gamer dashboard | 🟡 | **Done (Batch 3):** my bookings + cancel + assigned setups. Remaining: food/rewards/referrals/profile tabs |
| Food ordering (order → approval → deliver to setup) | ⬜ | blueprint §09 |
| Rewards / referrals / reviews | ⬜ | blueprint §08 |
| Events / tournaments (teams, brackets) | ⬜ | blueprint §10 |
| Admin panel + permissions + audit log | 🟡 | **Done (Batch 3):** RBAC (OWNER/ADMIN), bookings approve/assign/reject, setup maintenance, audit log. Remaining: reports, food/events admin, per-permission staff roles |
| Live availability strip (nav/hero) | ✅ | **Done (Batch 3):** wired to `/api/public/availability/day` |
| Notifications abstraction (mock → SMTP → WhatsApp) | ⬜ | §05 prompt |

## Acceptance criteria (blueprint §13) — status
- ⬜ No user can pay for an unavailable/overlapping slot *(needs backend)*
- ⬜ Public availability matches confirmed bookings + walk-ins + maintenance *(needs backend)*
- ⬜ Advance payment never shown as final confirmation before approval *(needs backend)*
- 🟡 Website usable on mobile + reduced motion even if 3D unavailable *(implemented this task; to be verified)*
- ⬜ Every sensitive admin action permission-checked + logged *(needs backend)*
