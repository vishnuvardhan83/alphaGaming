# AlphaQ Gaming — Server (API + database)

Node + Express + SQLite. Handles normal phone+password login (JWT), bookings,
UPI payment + admin approval, food orders, tournaments, rewards, reviews,
gallery uploads and admin settings. No Firebase, no external services.

## Run

```bash
npm install
npm start           # http://localhost:4000
```

- Database: `data/alphaq.db` (SQLite, created automatically, seeded on first run).
- Uploaded gallery images: `uploads/`.
- Both are gitignored and safe to delete to reset.

## Default admin

On first run it seeds an admin account:

- phone **9573976462** · password **admin123**

Change the password (and/or admin numbers) with env vars before first run:

```bash
ADMIN_PHONES=9573976462,9876543210 ADMIN_PASSWORD=YourStrongPass JWT_SECRET=some-long-random-string npm start
```

Anyone who registers with a number in `ADMIN_PHONES` becomes an admin.

## Inspect the data

```bash
sqlite3 data/alphaq.db ".tables"
sqlite3 data/alphaq.db "SELECT id,phone,name,role FROM users;"
```

Passwords are bcrypt-hashed. Or open `data/alphaq.db` in a GUI like
"DB Browser for SQLite".

## Deploy (single server hosts everything)

1. Build the frontend: `cd ../app && npm run build` (creates `app/dist`).
2. Copy `server/` and `app/dist` to your host (VPS, Render, Railway, etc.).
3. `cd server && npm install && JWT_SECRET=... ADMIN_PASSWORD=... node index.js`
   — the server detects `../app/dist` and serves the site + API on `PORT`
   (default 4000). Put it behind nginx/Caddy for HTTPS + a domain.

## Environment variables

| var | default | purpose |
|-----|---------|---------|
| `PORT` | 4000 | listen port |
| `JWT_SECRET` | dev secret | **set a strong random value in prod** |
| `ADMIN_PHONES` | 9573976462 | comma-separated admin phone numbers |
| `ADMIN_PASSWORD` | admin123 | seeded admin's password |

## API surface (summary)

- Auth: `POST /api/auth/register|login`, `GET /api/auth/me`
- Public: `GET /api/settings|games|food|tournaments|reviews|gallery|availability`
- Customer: `POST /api/bookings`, `/bookings/:id/pay|cancel`, `/food-orders`,
  `/tournaments/:id/register`, `/reviews`; `GET /api/bookings/mine`,
  `/food-orders/mine`, `/registrations/mine`, `/rewards/me`
- Admin (`/api/admin/*`): bookings approve/reject/complete, games/food/
  tournaments CRUD, food-order status, reviews moderation, gallery upload/delete,
  settings, users + reward adjustments
