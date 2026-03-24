# SteelCFO

AI-powered financial command center for structural steel contractors. Get CFO-level visibility into job costing, cash forecasting, AR/AP management, risk scoring, and an AI chat assistant with full financial context.

Built for steel fabricators and erectors who need real-time financial intelligence without the overhead of a full ERP system.

## Features

- **Job Costing** — Percentage-of-completion P&L, cost code breakdowns, WIP schedules, over/under billing analysis
- **Cash Forecasting** — 13-week rolling cash forecast with AR collection and AP payment projections
- **Receivables** — AR aging buckets, DSO tracking, collection priorities
- **Payables** — AP scheduling, vendor payment optimization, early-pay discount tracking
- **Risk Scoring** — Multi-factor risk engine (margin, AR, change orders, budget variance) with executive briefings
- **AI Chat** — Conversational CFO assistant powered by Claude with full access to your financial data
- **Reports** — Executive dashboards, job detail drilldowns, portfolio analytics

## Tech Stack

- **Framework:** Next.js 15 (App Router, React Server Components)
- **Language:** TypeScript (strict mode)
- **Database:** PostgreSQL + Prisma ORM
- **AI:** Anthropic Claude SDK (streaming SSE)
- **Auth:** NextAuth v5 (beta) + Prisma adapter
- **Charts:** Recharts
- **Styling:** Tailwind CSS with custom cyber/HUD dark theme

## Architecture

```
RSC Page → getAllData() → Pure Engine Functions → Components
```

- **Pages** are async React Server Components
- **Data layer** (`src/lib/data.ts`) fetches from Prisma, converts Decimal/Date types
- **Engines** (`src/lib/engines/`) are pure functions — no DB calls, no side effects
- **Components** render results with `force-dynamic` (no caching)

### Engine Modules

| Module | Purpose |
|--------|---------|
| `job-costing.ts` | Job P&L, cost codes, WIP schedule, backlog |
| `forecasting.ts` | 13-week cash forecast, AR aging, AP schedule |
| `risk.ts` | Risk scoring, CFO executive briefing generation |

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

### Setup

```bash
# Clone the repo
git clone https://github.com/Steel-tech/SteelCFO.git
cd SteelCFO

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database URL and API keys

# Set up database
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Auth signing key (generate with `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Auth redirect URL (`http://localhost:3000` for dev) |
| `ANTHROPIC_API_KEY` | Claude API key |

### Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run ESLint
npm run db:generate  # Regenerate Prisma client
npm run db:push      # Push schema to DB (dev)
npm run db:migrate   # Create and run migration
npm run db:seed      # Seed demo data
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Wipe + migrate + seed (destructive)
```

## Data Model

Multi-tenant by design — all queries filter by `organizationId`.

**Core entities:** Organizations, Users, Jobs, Cost Records, Invoices, Bills, Change Orders, Payroll Records, Bank Accounts

All monetary values stored as `Decimal(15,2)`. Dates stored as `@db.Date` and converted to `YYYY-MM-DD` strings for engine consumption.

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Push to your branch
5. Open a Pull Request

## Security

If you discover a security vulnerability, please report it responsibly by opening a [security advisory](https://github.com/Steel-tech/SteelCFO/security/advisories/new) instead of a public issue.

## License

[MIT](LICENSE)
