# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SteelCFO is an AI-powered financial command center for structural steel contractors. It provides CFO-level financial visibility including job costing, cash forecasting, AR/AP management, risk scoring, and an AI chat assistant with full financial context.

## Commands

```bash
# Development
npm run dev              # Start dev server on localhost:3000
npm run build            # Production build
npm run lint             # ESLint (eslint src/)

# Database (PostgreSQL + Prisma)
npm run db:generate      # Regenerate Prisma client after schema changes
npm run db:push          # Push schema to DB without migration (dev)
npm run db:migrate       # Create and run migration
npm run db:seed          # Seed demo data from CSV files (prisma/seed.ts)
npm run db:studio        # Launch Prisma Studio GUI
npm run db:reset         # Wipe + migrate + seed (destructive, dev only)
```

```bash
# Quality gates (run all three before pushing; CI enforces them)
npm run lint             # ESLint
npm run typecheck        # tsc --noEmit
npm test                 # Vitest unit tests (engines)
```

## Architecture

### Data Flow

```
RSC Page → getAllData() (lib/data.ts) → Pure Engine Functions (lib/engines/) → Components
```

1. **Pages** are async React Server Components that call the data layer
2. **Data layer** (`lib/data.ts`) fetches from Prisma and converts `Decimal` → `number`, `Date` → `string`
3. **Engines** (`lib/engines/`) are pure functions — no DB calls, no side effects — that compute financial analysis
4. **Components** render the results; all pages use `force-dynamic` (no caching)

### Engine Modules (`src/lib/engines/`)

- **`job-costing.ts`** — Job P&L summaries, cost code detail, WIP schedule, backlog (percentage-of-completion method)
- **`forecasting.ts`** — 13-week rolling cash forecast, AR aging buckets, AP payment schedule
- **`risk.ts`** — Multi-factor risk scoring (margin 35%, AR 25%, CO 20%, budget 20%), CFO executive briefing generation
- **`types.ts`** — Shared domain types (all plain numbers, no Prisma types)

### AI Chat (`src/app/api/chat/route.ts`)

POST endpoint with Zod input validation, rate limiting (20 req/min per IP), and session-based auth. Fetches all financial data, runs every engine, embeds results into a system prompt, then streams Claude's response via SSE with abort signal support for client disconnects.

### Authentication (`src/auth.ts`, `src/proxy.ts`)

NextAuth v5 with credentials provider, JWT strategy, Prisma adapter. Middleware protects all dashboard and API routes. Session includes `userId`, `organizationId`, and `role`.

**Demo mode:** Set `DEMO_MODE=true` to bypass authentication entirely — all routes are accessible without login. Useful for evaluation and development.

### Multi-Org Isolation

All queries filter by `organizationId`, resolved from the authenticated user's session via `getOrgId()` in `lib/data.ts`. Falls back to `"demo-steel-co"` in demo mode.

## Key Conventions

- **Decimal handling:** Prisma stores money as `Decimal(15,2)`. The data layer converts to plain `number` via `toNumber()` before passing to engines. Never pass Prisma Decimal types to engine functions.
- **Date handling:** Prisma uses `@db.Date`. Engines receive YYYY-MM-DD strings.
- **Path alias:** `@/*` maps to `./src/*`
- **Styling:** Custom "cyber/HUD" dark theme defined in `tailwind.config.ts` — neon colors (`neon-cyan`, `neon-green`, `neon-red`), custom fonts (JetBrains Mono, Orbitron), scan-line/glow animations. Use existing theme tokens, not raw hex values.
- **Icons:** Unicode symbols (⬡, ◈, ◇, ⚡, etc.) instead of icon libraries for nav items.
- **Components:** Custom shadcn-style components in `src/components/ui/` — not installed via shadcn CLI.

## Tech Stack

- **Framework:** Next.js 16 (App Router, RSC), React 19.2, TypeScript (strict)
- **Database:** PostgreSQL + Prisma 7 (driver adapter: @prisma/adapter-pg; CLI config in prisma.config.ts)
- **Auth:** NextAuth v5 beta + Prisma adapter + bcryptjs (JWT strategy)
- **AI:** Anthropic Claude SDK (`@anthropic-ai/sdk`)
- **Charts:** Recharts
- **Styling:** Tailwind CSS 3.4 with extensive custom theme
- **Validation:** Zod

## Environment Variables

```
DATABASE_URL           # PostgreSQL connection string
NEXTAUTH_SECRET        # Auth signing key
NEXTAUTH_URL           # Auth redirect URL (http://localhost:3000)
ANTHROPIC_API_KEY      # Claude API key
DEMO_MODE              # Set to "true" to bypass authentication
SEED_ADMIN_PASSWORD    # Password for seeded admin user (demo only)
```
