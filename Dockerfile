# --- Build stage -----------------------------------------------------------
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci && npx prisma generate

COPY . .
# Build-time placeholders; all pages are force-dynamic so no DB is contacted
ENV DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    NEXTAUTH_SECRET="build-placeholder" \
    NEXTAUTH_URL="http://localhost:3000" \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Runtime stage ---------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

# Runtime env (DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, ANTHROPIC_API_KEY)
# must be supplied by the orchestrator.
CMD ["node", "server.js"]
