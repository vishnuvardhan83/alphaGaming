# Deploy AlphaQ to Railway (public URL, works on phones + laptops)

This puts the whole app (React site + API) on the internet with an HTTPS URL like
`https://alphaq-production.up.railway.app`, backed by a Railway-managed MySQL.
No server admin, no domain required.

You do these steps once. After that, `railway up` (or a git push) redeploys.

---

## 0. One-time prep on your Mac

You need Node (already installed) and the Railway CLI:

```bash
npm i -g @railway/cli
railway login          # opens your browser to sign in / create a free account
```

---

## 1. Create the project and add MySQL

From the project folder (`/Users/ent-0439/Downloads/alphaq-gaming-ai-skills`):

```bash
cd /Users/ent-0439/Downloads/alphaq-gaming-ai-skills
railway init                    # give it a name, e.g. "alphaq"
railway add --database mysql     # adds a managed MySQL to the project
```

If `railway add --database mysql` isn't recognized, do it in the dashboard instead:
open the project (`railway open`) → **+ New** → **Database** → **MySQL**.

---

## 2. Deploy the app

```bash
railway up
```

This uploads the code and builds it using the `Dockerfile` (the build compiles the
React site and bundles it with the API into one service). First build takes a few
minutes. When it finishes you'll have an **app service** + a **MySQL service** in the
project.

---

## 3. Connect the app to MySQL + set secrets

Open the dashboard: `railway open` → click the **app service** → **Variables** tab →
add these (use the **Reference** / `${{ ... }}` picker for the MySQL ones so they auto-fill
from the MySQL service):

| Variable | Value |
|---|---|
| `DB_CLIENT` | `mysql` |
| `MYSQL_HOST` | `${{MySQL.MYSQLHOST}}` |
| `MYSQL_PORT` | `${{MySQL.MYSQLPORT}}` |
| `MYSQL_USER` | `${{MySQL.MYSQLUSER}}` |
| `MYSQL_PASSWORD` | `${{MySQL.MYSQLPASSWORD}}` |
| `MYSQL_DATABASE` | `${{MySQL.MYSQLDATABASE}}` |
| `JWT_SECRET` | a long random string — run `openssl rand -hex 32` and paste it |
| `ADMIN_PHONES` | `9573976462` (your admin phone, no +) |
| `ADMIN_PASSWORD` | a password you choose for the first admin login |

> The MySQL service name might not be exactly `MySQL` — use whatever the picker shows
> (e.g. `${{MySQL.MYSQLHOST}}`). Railway restarts the app automatically after you save.

You do **not** set `PORT` — Railway provides it and the app already reads it.

---

## 4. Get the public URL

In the dashboard: app service → **Settings** → **Networking** → **Generate Domain**
(pick the suggested port `4000`). Or from the terminal:

```bash
railway domain
```

Open that URL on your phone and your laptop — it's live for everyone. 🎉

**Admin login:** phone `9573976462`, password = the `ADMIN_PASSWORD` you set.
Log in and add your games, food menu, tournaments, gallery photos, contact details,
UPI ID, etc. from the admin screens — no redeploy needed.

---

## 5. Keep uploaded images after redeploys (recommended)

Photos you upload (gallery, food, backgrounds) are saved to disk. On Railway a
plain container's disk resets on each deploy, so add a **Volume**:

Dashboard → app service → **Settings** → **Volumes** → **New Volume**, mount path:

```
/srv/server/uploads
```

Now uploads survive redeploys.

---

## Redeploying later

```bash
railway up            # from the project folder — rebuilds and redeploys
```

(Optional) Connect the project to a GitHub repo in the dashboard for auto-deploy on
every `git push` instead of running `railway up` manually.

---

## Notes / gotchas

- **First load** may take ~10–20s while the container wakes if it was idle.
- **Database backups:** dashboard → MySQL service → **Data** / connect and run
  `mysqldump`, or use Railway's backup feature.
- **Costs:** Railway's free trial credit covers small usage; beyond that it's usage-based.
  A tiny app + MySQL is inexpensive.
- **Sample data:** the app seeds an admin + default settings only — no demo games/food.
  You fill real content via the admin panel.
