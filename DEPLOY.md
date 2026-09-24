# Deploying AlphaQ Gaming

The whole product is **one Node server** (`server/`) that:

- serves the JSON API under `/api`, and
- serves the built React app (`app/dist`) for everything else.

So you deploy **a single service** behind your domain. The database is **MySQL**
in production, with an automatic **SQLite fallback** for local dev (no MySQL
needed to just run it on your laptop).

Admins can change all site data **after** deploy — games, food menu, tournaments,
reviews, gallery images, contact details, UPI ID, PC/PS5 counts, background image,
booking approvals, user roles and reward points — from the in-app admin screens.
No redeploy required; changes are written straight to the database.

---

## Option A — Docker Compose (recommended)

Needs Docker + the Compose plugin on the server. This runs the app **and** MySQL
for you.

```bash
# 1. Get the code onto the server, then:
cp .env.example .env
nano .env                 # set strong passwords + a long random JWT_SECRET

# 2. Build and start (app + MySQL)
docker compose up -d --build

# 3. Check it's up
docker compose ps
curl -s http://localhost:4000/api/settings   # should return JSON
docker compose logs -f app                    # watch logs
```

The app listens on `http://localhost:4000`. MySQL data and uploaded images live in
named volumes (`db_data`, `uploads`) so they survive restarts and rebuilds.

- First boot auto-creates the tables and seeds defaults (games, food, reviews,
  settings, and the admin account).
- The seed dump `server/db/alphaq.mysql.sql` is also imported on the DB's first
  init (optional — see the comment in `docker-compose.yml`).

**Admin login:** phone `9573976462`, password = whatever you set as
`ADMIN_PASSWORD`. Change it after first login.

### Update to a new version

```bash
git pull            # or copy new files up
docker compose up -d --build
```

### Backups

```bash
# Dump the database
docker compose exec db sh -c 'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' > backup.sql
# Restore
docker compose exec -T db sh -c 'mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' < backup.sql
```

---

## Option B — Plain Linux VPS (Node + MySQL + Nginx)

Use this if you don't want Docker. Ubuntu/Debian shown.

### 1. Install prerequisites

```bash
sudo apt update
sudo apt install -y nginx mysql-server build-essential python3
# Node 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2
```

### 2. Create the MySQL database + user

```bash
sudo mysql
```
```sql
CREATE DATABASE alphaq CHARACTER SET utf8mb4;
CREATE USER 'alphaq'@'localhost' IDENTIFIED BY 'a-strong-password';
GRANT ALL PRIVILEGES ON alphaq.* TO 'alphaq'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

(Optional) import the seed dump — the app will also create/seed on first run:
```bash
mysql -u alphaq -p alphaq < server/db/alphaq.mysql.sql
```

### 3. Build the frontend

```bash
cd app
npm ci
npm run build          # produces app/dist
```

### 4. Configure + start the server

```bash
cd ../server
npm ci --omit=dev
cp .env.example .env
nano .env
```
Set in `.env`:
```
PORT=4000
JWT_SECRET=<long random string>       # e.g. openssl rand -hex 32
ADMIN_PHONES=9573976462
ADMIN_PASSWORD=<your admin password>
DB_CLIENT=mysql
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=alphaq
MYSQL_PASSWORD=a-strong-password
MYSQL_DATABASE=alphaq
```
Start it under PM2 (auto-restart + boot on reboot):
```bash
pm2 start index.js --name alphaq
pm2 save
pm2 startup            # run the command it prints
```

### 5. Nginx reverse proxy + your domain

Point your domain's DNS **A record** at the server's IP first. Then:

```bash
sudo nano /etc/nginx/sites-available/alphaq
```
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    client_max_body_size 8m;   # allow image uploads

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/alphaq /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 6. Free HTTPS (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```
Certbot rewrites the Nginx config for HTTPS and auto-renews.

### Updating later

```bash
cd app && git pull && npm ci && npm run build
cd ../server && npm ci --omit=dev
pm2 restart alphaq
```

---

## cPanel / shared hosting (brief)

1. Create a MySQL database + user in cPanel; import `server/db/alphaq.mysql.sql`
   via **phpMyAdmin → Import**.
2. Build `app/` locally (`npm run build`) and upload the `app/dist` folder next to
   `server/` (so `server/../app/dist` exists).
3. Use cPanel's **Setup Node.js App**: app root = `server/`, startup file =
   `index.js`, run `npm install`. Add the env vars from step 4 above
   (`DB_CLIENT=mysql`, `MYSQL_*`, `JWT_SECRET`, `ADMIN_*`).
4. Start the app; cPanel handles the domain mapping and SSL (AutoSSL).

---

## Environment variables reference

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | Port the server listens on | `4000` |
| `JWT_SECRET` | Signs login tokens — **must** change | dev placeholder |
| `ADMIN_PHONES` | Comma-separated phones auto-granted admin | `9573976462` |
| `ADMIN_PASSWORD` | Password for the admin created on first run | `admin123` |
| `DB_CLIENT` | `mysql` or `sqlite` | `sqlite` unless MySQL vars set |
| `MYSQL_HOST` / `MYSQL_PORT` | MySQL location | `localhost` / `3306` |
| `MYSQL_USER` / `MYSQL_PASSWORD` | MySQL credentials | `root` / empty |
| `MYSQL_DATABASE` | Database name | `alphaq` |
| `DATABASE_URL` | Alt. single connection string (`mysql://user:pass@host:port/db`) | — |
| `SQLITE_PATH` | SQLite file path (fallback mode) | `server/data/alphaq.db` |
| `ADMIN_EMAIL` | Admin email address receiving booking notifications | `v9347976462@gmail.com` |
| `EMAIL_HOST` | SMTP server host (e.g. `smtp.gmail.com`) | empty (dev mock mode) |
| `EMAIL_PORT` | SMTP port (`587` for TLS, `465` for SSL) | `587` |
| `EMAIL_SECURE` | Set `true` if port 465, `false` for STARTTLS | `false` |
| `EMAIL_USER` | SMTP username / sender account email | empty |
| `EMAIL_PASSWORD` | SMTP app password or secret | empty |
| `EMAIL_FROM` | From header (e.g. `"AlphaQ Gaming" <hello@alphaq.gg>`) | `EMAIL_USER` |
| `OTP_EXPIRY_MINUTES` | Verification OTP validity window in minutes | `5` |
| `OTP_MAX_ATTEMPTS` | Max failed OTP verification attempts before invalidation | `5` |
| `OTP_RESEND_COOLDOWN_SECONDS` | Cooldown period between OTP resend requests in seconds | `60` |

Setting any `MYSQL_*` var (or `DATABASE_URL` / `MYSQL_URL`) switches to MySQL automatically;
set `DB_CLIENT=sqlite` to force the local file DB.
Migrations run automatically before the server starts (`npm run migrate`).

