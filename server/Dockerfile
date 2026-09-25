# AlphaQ Gaming — Production multi-stage Docker build for Koyeb
# Builds React SPA frontend and serves it directly from the Express backend.

# ---- Stage 1: build React SPA -> app/dist ----
FROM node:20-bookworm AS web
WORKDIR /web
COPY app/package*.json ./
RUN npm ci
COPY app/ ./
RUN npm run build

# ---- Stage 2: install Express production dependencies ----
FROM node:20-bookworm AS server-deps
WORKDIR /srv/server
COPY server/package*.json ./
RUN npm ci --omit=dev

# ---- Stage 3: production runtime ----
FROM node:20-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /srv/server

# Copy server code and production node_modules
COPY server/ ./
COPY --from=server-deps /srv/server/node_modules ./node_modules

# Copy built React frontend to expected location
COPY --from=web /web/dist /srv/app/dist

# Koyeb dynamic port configuration (listens on 0.0.0.0:$PORT)
ENV PORT=4000
ENV HOST=0.0.0.0
EXPOSE 4000

CMD ["sh", "-c", "node migrations/runner.js && node index.js"]
