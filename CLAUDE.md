# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SteelCFO is an AI-powered financial command center for structural steel contractors. It provides CFO-level financial visibility including job costing, cash forecasting, AR/AP management, risk scoring, and an AI chat assistant with full financial context.

## Commands

```bash
# Development
npm run dev              # Start dev server on localhost:3000
npm run build            # Production build
npm run lint             # ESLint (next/core-web-vitals + next/typescript)

# Database (PostgreSQL + Prisma)
npm run db:generate      # Regenerate Prisma client after schema changes
npm run db:push          # Push schema to DB without migration (dev)
npm run db:migrate       # Create and run migration
npm run db:seed          # Seed demo data from CSV files (prisma/seed.ts)
npm run db:studio        # Launch Prisma Studio GUI
npm run db:reset         # Wipe + migrate + seed (destructive, dev only)
```

No test framework is configured.

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

POST endpoint that fetches all financial data, runs every engine, embeds results into a system prompt, then streams Claude's response via SSE. Client uses EventSource for real-time display.

### Multi-Org Isolation

All queries filter by `organizationId`. Currently hardcoded to `"demo-steel-co"` for demo mode.

## Key Conventions

- **Decimal handling:** Prisma stores money as `Decimal(15,2)`. The data layer converts to plain `number` via `toNumber()` before passing to engines. Never pass Prisma Decimal types to engine functions.
- **Date handling:** Prisma uses `@db.Date`. Engines receive YYYY-MM-DD strings.
- **Path alias:** `@/*` maps to `./src/*`
- **Styling:** Custom "cyber/HUD" dark theme defined in `tailwind.config.ts` — neon colors (`neon-cyan`, `neon-green`, `neon-red`), custom fonts (JetBrains Mono, Orbitron), scan-line/glow animations. Use existing theme tokens, not raw hex values.
- **Icons:** Unicode symbols (⬡, ◈, ◇, ⚡, etc.) instead of icon libraries for nav items.
- **Components:** Custom shadcn-style components in `src/components/ui/` — not installed via shadcn CLI.

## Tech Stack

- **Framework:** Next.js 15 (App Router, RSC), React 19, TypeScript (strict)
- **Database:** PostgreSQL + Prisma 6.2
- **Auth:** NextAuth v5 beta + Prisma adapter + bcryptjs
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
```
