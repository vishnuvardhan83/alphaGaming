# AlphaQ Gaming — single image that builds the React SPA and serves it together
# with the Express API (the server serves ../app/dist in production).

# ---- Stage 1: build the React SPA -> app/dist ----
FROM node:20-bookworm AS web
WORKDIR /web
COPY app/package*.json ./
RUN npm ci
COPY app/ ./
RUN npm run build

# ---- Stage 2: install server production dependencies ----
# (Debian base so better-sqlite3's native module compiles if no prebuild exists.)
FROM node:20-bookworm AS server-deps
WORKDIR /srv/server
COPY server/package*.json ./
RUN npm ci --omit=dev

# ---- Stage 3: runtime ----
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /srv/server
COPY server/ ./
COPY --from=server-deps /srv/server/node_modules ./node_modules
COPY --from=web /web/dist /srv/app/dist
EXPOSE 4000
CMD ["node", "index.js"]
