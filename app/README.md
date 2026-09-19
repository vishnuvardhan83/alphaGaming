# AlphaQ Gaming — Web App (frontend)

React 19 + TanStack Router (SPA) + Tailwind v4. Talks to the AlphaQ Node/SQLite
API (in `../server`) over same-origin `/api` (proxied in dev, served by the Node
server in prod). No Firebase, no external accounts.

## Run in development

You need TWO terminals:

```bash
# 1) API server  (../server)
cd ../server && npm install && npm start        # http://localhost:4000

# 2) this app
npm install && npm run dev                       # http://localhost:5173
```

Vite proxies `/api` and `/uploads` to the server on :4000, so just open
http://localhost:5173.

## Build for production

```bash
npm run build        # outputs static files to app/dist
```

The Node server automatically serves `app/dist` when it exists, so in production
you run **only the server** and it hosts both the site and the API on one port.
See `../server/README.md` for the deploy steps.

## Default admin login

Phone **9573976462** · password **admin123** (change it — see server README).
Admins get the `/admin` portal: approve bookings, manage games/food/tournaments,
moderate reviews, upload gallery photos, edit settings (WhatsApp/UPI/contact),
and adjust reward points.

## Structure

```
src/
  routes/        index, auth, book, dashboard, admin, __root
  components/    site-nav, site-footer, auth-form, food-order-panel,
                 tournaments-section, whatsapp-button, hero-3d, setup-notice
  lib/           api (fetch client), auth (JWT context), bookings, db, content
  styles.css     Tailwind v4 + electric-green theme
```
