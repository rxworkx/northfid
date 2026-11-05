FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Prisma needs OpenSSL at runtime; the slim image does not include it.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Install all dependencies. better-sqlite3 falls back to compiling from source
# when no prebuilt binary matches, so the build tools stay in this stage only.
FROM base AS deps
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

# NEXT_PUBLIC_* values are inlined into the bundle by `next build`, so changing
# one means rebuilding the image, not just restarting the container.
FROM deps AS builder
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_APP_NAME=Northfid
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
COPY . .
RUN npm run build

# Dev dependencies are kept on purpose: tsx runs the seed script, and
# `next start` needs typescript to load next.config.ts.
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV DATABASE_URL=file:/app/data/northfid.db
ENV PRIVATE_UPLOADS_DIR=/app/data/private-uploads
COPY --from=builder --chown=node:node /app /app
RUN install -d -o node -g node /app/data /app/public/uploads \
  && chmod +x /app/docker-entrypoint.sh
USER node
VOLUME ["/app/data", "/app/public/uploads"]
EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
