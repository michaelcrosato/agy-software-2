# syntax=docker/dockerfile:1

# ─── Stage 1: Builder ────────────────────────────────────────────────────────
# Use Debian glibc so better-sqlite3 native bindings install without issues.
FROM node:24-bookworm-slim AS builder

WORKDIR /app

# Copy the full source BEFORE npm ci so that prisma generate (postinstall)
# can find prisma/schema.prisma. Copying package files alone first would fail.
COPY . .

# Install all dependencies (runs postinstall → prisma generate automatically).
RUN npm ci

# Build Next.js in standalone mode (emits .next/standalone/server.js).
RUN npm run build

# Bake in a seeded database so the first deploy has sample data.
RUN npm run seed

# ─── Stage 2: Runner ─────────────────────────────────────────────────────────
FROM node:24-bookworm-slim AS runner

WORKDIR /app

# Copy only the standalone output — no node_modules or source needed at runtime.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Bake the seeded database into the image as a seed template.
# On first boot the CMD below copies this onto the persistent volume.
COPY --from=builder /app/prisma/dev.db /app/seed/answerflow.db

# Runtime environment.
# HOSTNAME=0.0.0.0 is mandatory — the standalone server binds localhost otherwise
# and Fly.io's proxy cannot reach the container.
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_URL=file:/data/answerflow.db

EXPOSE 3000

# On first boot: ensure the /data directory exists and populate it from the
# baked seed if no database exists yet, then start the server.
# This makes the persistent volume hold the live SQLite file.
CMD ["sh", "-c", "mkdir -p /data && if [ ! -f /data/answerflow.db ]; then cp /app/seed/answerflow.db /data/answerflow.db; fi && exec node server.js"]
