<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?logo=next.js" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-6-2D3748?logo=prisma" alt="Prisma 6" />
  <img src="https://img.shields.io/badge/Claude-AI-orange?logo=anthropic" alt="Claude AI" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License" />
</p>

<h1 align="center">SteelCFO</h1>

<p align="center">
  <strong>AI-Powered Financial Command Center for Structural Steel Contractors</strong>
</p>

<p align="center">
  CFO-level financial visibility into job costing, cash forecasting, AR/AP management, risk scoring, and an AI chat assistant — purpose-built for steel fabricators and erectors who need real-time financial intelligence without the overhead of a full ERP system.
</p>

---

## Why SteelCFO?

Steel construction is a capital-intensive, cash-hungry business. Material purchases happen months before erection. Payroll goes out weekly regardless of collections. Change orders are the hidden profit engine — or the hidden margin killer. And percentage-of-completion accounting determines whether your WIP schedule impresses or alarms your bonding company.

**SteelCFO gives you the financial visibility that matters:**

- Know your **real margin** on every job — not what the estimate said, but what the cost codes are telling you right now
- See cash shortfalls **13 weeks before they hit** — not when the bank calls
- Catch margin fade at **2% erosion**, not 8%
- Score every active job for risk and get **specific action items**, not vague warnings
- Ask your AI CFO anything — it has full access to your live financial data

---

## Features

### 📊 Command Center Dashboard
Executive overview with cash position, AR outstanding, AP due this week, threat-level indicator, 13-week cash forecast chart, priority action items, risk table, portfolio matrix, and cash forecast summary — all computed server-side from live data.

### 💰 Job Costing
Percentage-of-completion P&L for every active job. Revised contract values (including approved change orders), cost-to-date, projected cost at completion, projected margin, earned revenue, and over/under billing analysis. Drill into any job for cost-code-level breakdowns.

### 📈 Cash Forecasting
13-week rolling cash projection built from AR collection schedules (due-date matching), AP payment obligations, and payroll (4-week rolling average). Identifies the minimum cash balance and which week it hits.

### 🧾 Receivables (AR Aging)
Customer-level aging buckets: current, 1-30, 31-60, 61-90, 90+ days overdue. Portfolio-level DSO calculation. Flags collection priorities automatically.

### 📋 Payables (AP Schedule)
Weekly AP payment buckets with vendor breakdown. Identifies overdue payments, upcoming obligations in the next 7 and 30 days.

### ⚡ Risk Scoring Engine
Multi-factor risk model scoring every active job on four dimensions:

| Factor | Weight | What It Measures |
|--------|--------|-----------------|
| Margin Risk | 35% | Projected margin vs. original estimate |
| AR Risk | 25% | Overdue receivables for the job |
| CO Risk | 20% | Pending change order exposure |
| Budget Risk | 20% | Actual + committed vs. budget |

Jobs are scored 0-10 and classified as **low**, **medium**, **high**, or **critical** risk.

### 📑 Reports
WIP (work-in-progress) schedule with over/under billing analysis and backlog report showing remaining contract value, burn rates, and estimated months of work.

### 🤖 AI Chat Assistant
Conversational CFO powered by Claude with full access to your financial data. Every message triggers a fresh computation of all engine functions — the AI sees your current cash position, job summaries, risk scores, AR aging, and cash forecast in real time.

**Pre-built conversation starters:**
- "Give me this week's CFO brief"
- "Which jobs have the highest risk right now?"
- "What's our cash position and 13-week outlook?"
- "Show me the AR aging — who owes us money?"
- "Which jobs are underbilled and by how much?"

---

## Architecture

```
Browser → Next.js RSC Page → getAllData() → Pure Engine Functions → React Components
                                  ↓
                            Prisma (PostgreSQL)

Browser → /api/chat → getAllData() + All Engines → System Prompt → Claude API (SSE) → Browser
```

### Design Principles

1. **Pages are async React Server Components** — data fetching happens on the server, never in the browser
2. **Data layer converts types** — Prisma `Decimal` → `number`, `Date` → `"YYYY-MM-DD"` string at the boundary
3. **Engines are pure functions** — no database calls, no side effects, no I/O. Testable in isolation
4. **All pages use `force-dynamic`** — no stale cached data, ever
5. **Multi-tenant by design** — every query scopes to `organizationId` from the authenticated session

### Engine Modules

| Module | File | Purpose |
|--------|------|---------|
| Job Costing | `src/lib/engines/job-costing.ts` | Job P&L, cost codes, WIP schedule, backlog |
| Forecasting | `src/lib/engines/forecasting.ts` | 13-week cash forecast, AR aging, AP schedule |
| Risk | `src/lib/engines/risk.ts` | Multi-factor risk scoring, CFO executive briefing |
| Types | `src/lib/engines/types.ts` | Shared domain types (all plain numbers, no Prisma types) |

### AI Chat Implementation

The chat endpoint (`src/app/api/chat/route.ts`) implements:

- **Rate limiting** — 20 requests/minute per IP
- **Input validation** — Zod schema enforcement
- **Context injection** — Live financial data from all engines embedded in the system prompt
- **Streaming** — Server-Sent Events with abort signal support for client disconnects
- **XSS protection** — HTML entity escaping + tag allowlisting in the chat renderer

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, React Server Components) |
| **Language** | TypeScript 5.7 (strict mode) |
| **Database** | PostgreSQL 14+ with [Prisma 6](https://www.prisma.io/) ORM |
| **AI** | [Anthropic Claude SDK](https://docs.anthropic.com/en/docs/build-with-claude/typescript-sdk) (streaming SSE) |
| **Auth** | [NextAuth v5](https://authjs.dev/) (beta) + Prisma adapter + JWT strategy |
| **Charts** | [Recharts](https://recharts.org/) |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) with custom cyber/HUD dark theme |
| **Validation** | [Zod](https://zod.dev/) |
| **Fonts** | JetBrains Mono (monospace), Orbitron (display) |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **PostgreSQL** 14+
- **Anthropic API key** — [console.anthropic.com](https://console.anthropic.com) (required for AI chat)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/Steel-tech/SteelCFO.git
cd SteelCFO

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database URL and API keys

# Set up database and seed demo data
npm run db:push
npm run db:seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). With `DEMO_MODE=true` (default in `.env.example`), you'll go straight to the dashboard with demo data for a fictional steel contractor.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | Auth signing key (generate: `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | ✅ | Auth redirect URL (`http://localhost:3000` for dev) |
| `ANTHROPIC_API_KEY` | For AI chat | Claude API key from Anthropic |
| `DEMO_MODE` | Optional | `"true"` to bypass authentication (evaluation/demo) |
| `SEED_ADMIN_PASSWORD` | Optional | Password for seeded admin user (default: `change-me-in-production`) |

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server on `localhost:3000` |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint on `src/` |
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:push` | Push schema to database (dev — no migration files) |
| `npm run db:migrate` | Create and apply a named migration |
| `npm run db:seed` | Seed database with demo data from CSV files |
| `npm run db:studio` | Open Prisma Studio GUI for data inspection |
| `npm run db:reset` | ⚠️ Wipe database + migrate + seed (destructive) |

---

## Data Model

Multi-tenant by design — all entities belong to an `Organization` and all queries filter by `organizationId`.

### Core Entities

| Entity | Description | Key Fields |
|--------|-------------|------------|
| **Organization** | Tenant boundary | `id`, `name` |
| **User** | Authenticated user | `email`, `role` (ADMIN/CFO/PM/VIEWER), `organizationId` |
| **Job** | Construction project | `contractValue`, `estimatedCost`, `status`, `type`, `tons` |
| **CostRecord** | Cost-code-level actuals | `costCode`, `budgetAmount`, `actualAmount`, `committedAmount`, `costType` |
| **Invoice** | Accounts receivable | `amount`, `amountPaid`, `dueDate`, `status`, `retainage` |
| **Bill** | Accounts payable | `amount`, `dueDate`, `vendor`, `category`, `discountPercent` |
| **ChangeOrder** | Scope/price changes | `amount`, `status` (approved/pending/rejected), `probability` |
| **PayrollRecord** | Weekly payroll | `grossPay`, `totalHours`, `tonsInstalled`, `hoursPerTon` |
| **BankAccount** | Cash positions | `balance`, `availableCredit`, `accountType` |
| **ChatMessage** | AI conversation log | `role`, `content`, `userId` |

### Financial Conventions

- All monetary values: `Decimal(15,2)` in database, converted to `number` at the engine boundary
- All dates: `@db.Date` in database, converted to `"YYYY-MM-DD"` string for engines
- Job types: `structural`, `misc`, `ornamental`
- Cost types: `material`, `labor`, `equipment`, `sub`, `engineering`, `coatings`

---

## Demo Data

The seed script (`prisma/seed.ts`) loads 7 CSV files from `data/sample/` containing realistic data for "Demo Steel Co":

| Dataset | Records | Highlights |
|---------|---------|------------|
| **Jobs** | 8 | Mix of structural, misc, ornamental — active, complete, pending |
| **Costs** | Per code per job | 7 cost code categories with budget, actual, and committed |
| **AR (Invoices)** | Multiple per job | Open, paid, partial — realistic aging distribution |
| **AP (Bills)** | Multiple vendors | Materials, subs, equipment — includes overhead items |
| **Change Orders** | Per job | Approved, pending, rejected — with probability weighting |
| **Bank Accounts** | 3 accounts | Operating, payroll, line of credit |
| **Payroll** | Weekly records | Hours, gross pay, tons installed, hours/ton |

**Demo login:** `admin@steelcfo.com` (password set by `SEED_ADMIN_PASSWORD`)

---

## AI Agent System

SteelCFO includes a multi-agent AI system for local development and analysis, powered by the [Pi coding agent framework](https://github.com/mariozechner/pi-coding-agent).

### Agent Team

| Agent | Role | Specialty |
|-------|------|-----------|
| **CFO** (lead) | Orchestrator | Executive summaries, cross-domain analysis |
| **Job Cost Analyst** | Specialist | POC accounting, cost codes, productivity, WIP |
| **Treasury Analyst** | Specialist | Cash forecasting, AR/AP, liquidity management |
| **Risk Analyst** | Specialist | Risk scoring, early warnings, bonding impact |

### Tools (14 total)

Data management (`import_data`, `query_data`), job costing (`job_cost_summary`, `job_cost_detail`, `productivity_report`, `co_pipeline`, `wip_schedule`, `backlog_report`), cash management (`cash_forecast`, `cash_forecast_scenario`, `ar_aging`, `ap_schedule`), risk & reporting (`risk_dashboard`, `cfo_brief`).

📖 **Full documentation:** See [AGENT.md](AGENT.md) for complete agent architecture, tool specifications, domain knowledge, and extension guide.

---

## Project Structure

```
steelcfo/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts    # NextAuth handlers
│   │   │   └── chat/route.ts                  # AI chat endpoint (SSE)
│   │   ├── (dashboard)/
│   │   │   └── dashboard/
│   │   │       ├── page.tsx                   # Command Center
│   │   │       ├── jobs/page.tsx              # Job listing
│   │   │       ├── jobs/[jobId]/page.tsx      # Job detail
│   │   │       ├── cash/page.tsx              # Cash forecasting
│   │   │       ├── receivables/page.tsx       # AR aging
│   │   │       ├── payables/page.tsx          # AP schedule
│   │   │       ├── risk/page.tsx              # Risk dashboard
│   │   │       ├── reports/page.tsx           # WIP & backlog
│   │   │       └── chat/page.tsx              # AI assistant
│   │   ├── login/page.tsx                     # Auth login
│   │   ├── page.tsx                           # Root redirect
│   │   ├── layout.tsx                         # Root layout
│   │   └── globals.css                        # Global styles
│   ├── components/
│   │   ├── ui/                                # Base UI components (card, button, table, etc.)
│   │   ├── charts/                            # Recharts wrappers
│   │   ├── sidebar.tsx                        # Navigation sidebar
│   │   ├── header.tsx                         # Top header bar
│   │   ├── metric-card.tsx                    # Dashboard metric cards
│   │   ├── risk-table.tsx                     # Risk score table
│   │   └── demo-banner.tsx                    # Demo mode indicator
│   ├── lib/
│   │   ├── engines/
│   │   │   ├── types.ts                       # Shared domain types
│   │   │   ├── job-costing.ts                 # Job P&L, WIP, backlog
│   │   │   ├── forecasting.ts                 # Cash forecast, AR aging, AP
│   │   │   └── risk.ts                        # Risk scoring, CFO brief
│   │   ├── data.ts                            # Prisma → engine type conversion
│   │   ├── db.ts                              # Prisma client singleton
│   │   └── utils.ts                           # Utility functions
│   ├── auth.ts                                # NextAuth configuration
│   ├── auth.config.ts                         # Auth config (edge-compatible)
│   ├── middleware.ts                          # Route protection
│   └── types/
│       └── next-auth.d.ts                     # NextAuth type augmentation
├── prisma/
│   ├── schema.prisma                          # Database schema (15 models)
│   └── seed.ts                                # CSV-to-database seeder
├── data/sample/                               # Demo CSV data files (7 files)
├── extensions/                                # Pi agent tool extensions
│   ├── steelcfo-data.ts                       # Data import/query tools
│   ├── steelcfo-calc.ts                       # Job costing tools
│   └── steelcfo-forecast.ts                   # Forecasting/risk tools
├── .pi/
│   ├── agents/                                # Agent definitions (4 agents)
│   ├── prompts/                               # Prompt templates (4 prompts)
│   ├── skills/                                # Multi-step workflows (4 skills)
│   └── themes/                                # TUI theme
├── AGENT.md                                   # Full AI agent documentation
├── CLAUDE.md                                  # Claude Code development guide
└── package.json
```

---

## Security

### Production Hardening

- **Authentication**: NextAuth v5 with JWT strategy and bcryptjs password hashing
- **Route protection**: Middleware guards all dashboard and API routes
- **Rate limiting**: 20 req/min per IP on the chat endpoint
- **Input validation**: Zod schemas on all API inputs
- **XSS prevention**: HTML entity escaping + tag allowlisting in chat renderer
- **Security headers**: CSP, X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Permissions-Policy (camera/mic/geo disabled)
- **Multi-tenancy**: Organization-scoped queries prevent cross-tenant data access

### Demo Mode Warning

⚠️ When `DEMO_MODE=true`, **all authentication is bypassed**. This is intended for local evaluation only. Never deploy with demo mode enabled.

---

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run quality checks:
   ```bash
   npm run lint
   npm run build
   ```
5. Commit with a descriptive message
6. Push to your branch and open a Pull Request

### Development Guidelines

- **Type safety**: All code must pass `tsc --noEmit` with strict mode
- **Engine purity**: Functions in `src/lib/engines/` must have zero side effects
- **Component convention**: One component per file, descriptive names
- **Styling**: Use existing Tailwind theme tokens (`neon-cyan`, `cyber-dark`, etc.) — not raw hex values
- **Icons**: Unicode symbols (⬡, ◈, ◇, ⚡) instead of icon libraries for navigation

---

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please report it responsibly by opening a [security advisory](https://github.com/Steel-tech/SteelCFO/security/advisories/new) instead of a public issue.

---

## License

[MIT](LICENSE) — Copyright © 2026 [Steel-tech](https://github.com/Steel-tech)
