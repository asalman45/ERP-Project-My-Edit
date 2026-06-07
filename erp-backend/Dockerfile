# ─── Stage 1: Install dependencies ───────────────────────────────────────────
FROM node:18-bullseye AS deps

WORKDIR /app

# Install system deps needed by Puppeteer/Chromium
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    chromium \
    ca-certificates \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libgtk-3-0 \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
# Configure npm for resilience: longer timeout + retries (prevents ECONNRESET on slow networks)
RUN npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm config set fetch-retries 5 \
    && npm config set fetch-timeout 120000
# Use a mirror for Prisma engines to prevent network reset on large binaries
ENV PRISMA_ENGINES_MIRROR=https://npmmirror.com/mirrors/prisma
ENV PRISMA_BINARIES_MIRROR=https://npmmirror.com/mirrors/prisma
# Install ALL deps (including dev) so prisma CLI is available
RUN npm ci

# ─── Stage 2: Generate Prisma client ─────────────────────────────────────────
FROM deps AS builder

WORKDIR /app

COPY prisma ./prisma
RUN npx prisma generate

# ─── Stage 3: Production image ────────────────────────────────────────────────
FROM node:18-bullseye-slim AS runner

WORKDIR /app

# Only the Chromium runtime libraries we actually need
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    chromium \
    ca-certificates \
    fonts-liberation \
    libnss3 \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libgtk-3-0 \
    wget \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production \
    PORT=4000 \
    PUPPETEER_CACHE_DIR=/app/.cache

# Copy node_modules + generated prisma client from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Copy application source
COPY . .

RUN mkdir -p /app/uploads/images /app/uploads/documents /app/backups

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["node", "src/index.js"]
