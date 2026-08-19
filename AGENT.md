# AGENT.md — SteelCFO AI Agent Architecture

> Comprehensive technical reference for every AI agent, extension, tool, prompt, and skill that powers SteelCFO. This document is the single source of truth for understanding, extending, and debugging the AI layer.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Agent Team Architecture](#agent-team-architecture)
3. [Lead Agent: CFO](#lead-agent-cfo)
4. [Specialist Agent: Job Cost Analyst](#specialist-agent-job-cost-analyst)
5. [Specialist Agent: Treasury Analyst](#specialist-agent-treasury-analyst)
6. [Specialist Agent: Risk Analyst](#specialist-agent-risk-analyst)
7. [Extension Layer](#extension-layer)
8. [Engine Layer (Pure Functions)](#engine-layer-pure-functions)
9. [AI Chat API — The Runtime Bridge](#ai-chat-api--the-runtime-bridge)
10. [Data Pipeline](#data-pipeline)
11. [Prompt Templates](#prompt-templates)
12. [Skills](#skills)
13. [Theme & Presentation](#theme--presentation)
14. [Security Model](#security-model)
15. [Adding a New Agent or Tool](#adding-a-new-agent-or-tool)
16. [Debugging & Troubleshooting](#debugging--troubleshooting)
17. [Domain Knowledge Reference](#domain-knowledge-reference)

---

## System Overview

SteelCFO operates on a **dual-runtime AI architecture**:

### Runtime 1 — Web Application (Next.js)
The production web app uses the **Anthropic Claude SDK** to power a streaming AI chat assistant. Financial data flows from PostgreSQL → Prisma → pure engine functions → a rich system prompt → Claude's response streamed via SSE to the browser.

### Runtime 2 — Pi Agent System (Local)
A multi-agent team powered by [Pi](https://github.com/mariozechner/pi-coding-agent) runs locally with tool-calling capabilities. Four specialized agents collaborate through a routing system, each with domain-specific tools provided by TypeScript extensions.

> **Note:** The Pi runtime files referenced below (`.pi/`, `extensions/`) are
> not checked into this repository — they live in the local Pi workspace.
> Only Runtime 1 (the Next.js web app) is contained in this repo; its engine
> layer is the ported, canonical implementation of the same financial logic.

```
┌─────────────────────────────────────────────────────────────────┐
│                        SteelCFO AI Layer                        │
├────────────────────────────┬────────────────────────────────────┤
│   Web App (Production)     │   Pi Agent System (Local/Dev)      │
│                            │                                    │
│   Browser                  │   Pi TUI / CLI                     │
│     ↓                      │     ↓                              │
│   /api/chat (SSE)          │   Team Router (teams.yaml)         │
│     ↓                      │     ↓                              │
│   getAllData() + Engines   │   CFO Agent (lead)                 │
│     ↓                      │     ├── Job Cost Analyst           │
│   System Prompt Builder    │     ├── Treasury Analyst            │
│     ↓                      │     └── Risk Analyst                │
│   Claude API (streaming)   │           ↓                        │
│     ↓                      │   Extensions (tools)               │
│   SSE → Browser            │     ├── steelcfo-data.ts           │
│                            │     ├── steelcfo-calc.ts           │
│                            │     └── steelcfo-forecast.ts       │
└────────────────────────────┴────────────────────────────────────┘
                              ↕
                    Shared: Engine Logic
                    src/lib/engines/*.ts
```

### Three Guiding Principles

Every agent, tool, and prompt in the system serves at least one:

1. **Protect Cash** — Cash is oxygen. A profitable company can die without it.
2. **Protect Margin** — Margin erosion is silent. Track earned vs. burned at the cost-code level.
3. **Reduce Surprises** — Surprises destroy trust with owners, banks, and bonding companies.

---

## Agent Team Architecture

**File:** `.pi/agents/teams.yaml`

```yaml
teams:
  cfo-team:
    lead: cfo
    members:
      - job-cost-analyst
      - treasury-analyst
      - risk-analyst
```

### Routing Rules

The team router uses regex pattern matching to delegate queries to the right specialist:

| Pattern | Agent | Handles |
|---------|-------|---------|
| `job cost\|margin\|fade\|productivity\|wip\|change order\|backlog\|percent complete` | Job Cost Analyst | All job-level financial analysis |
| `cash\|forecast\|ar \|ap \|aging\|receivable\|payable\|collection\|payment\|bank\|credit line` | Treasury Analyst | Cash management and forecasting |
| `risk\|health score\|warning\|exposure\|bonding capacity\|concentration` | Risk Analyst | Risk identification and scoring |
| `brief\|summary\|overview\|how are we doing\|status` | CFO (lead) | Executive summaries and cross-domain |

If no pattern matches, the CFO agent handles the query directly.

---

## Lead Agent: CFO

**File:** `.pi/agents/cfo.md`

### Identity

- **Name:** `cfo`
- **Model:** `claude-sonnet`
- **Temperature:** `0.3` (low — data-driven, consistent)
- **Role:** Lead agent, orchestrates the team, handles executive-level queries

### Personality

The CFO speaks like a seasoned construction finance executive with 20+ years in structural steel. Blunt, data-first, action-oriented. Never gives generic accounting advice — every recommendation is steel-specific.

### Tools Available (14 total)

| Tool | Source Extension | Purpose |
|------|-----------------|---------|
| `import_data` | steelcfo-data | Ingest CSV/JSON financial data |
| `query_data` | steelcfo-data | Ad-hoc queries with filters and aggregation |
| `job_cost_summary` | steelcfo-calc | Portfolio or single-job P&L |
| `job_cost_detail` | steelcfo-calc | Cost-code level breakdown |
| `productivity_report` | steelcfo-calc | Hours/ton trending and analysis |
| `co_pipeline` | steelcfo-calc | Change order lifecycle tracking |
| `wip_schedule` | steelcfo-calc | Over/under billing analysis |
| `backlog_report` | steelcfo-calc | Remaining work and pipeline |
| `cash_forecast` | steelcfo-forecast | 13-week rolling cash projection |
| `cash_forecast_scenario` | steelcfo-forecast | What-if scenario modeling |
| `ar_aging` | steelcfo-forecast | Receivables aging by customer |
| `ap_schedule` | steelcfo-forecast | Payables scheduling and discounts |
| `risk_dashboard` | steelcfo-forecast | Multi-factor job risk scoring |
| `cfo_brief` | steelcfo-forecast | Weekly executive briefing |

### Conversation Strategy

1. **First contact** → Offer a CFO Brief for the lay of the land
2. **Vague "how are we doing?"** → Run `cfo_brief`
3. **Job question** → `job_cost_summary` first, drill into `job_cost_detail` if fade detected
4. **Cash question** → Always present 13-week view, then offer scenarios
5. **Risk question** → `risk_dashboard` for big picture, then drill into top 2-3 risks

### Severity Classification

| Level | Criteria |
|-------|----------|
| **CRITICAL** | Cash shortfall within 2 weeks, margin fade > 5%, bonding capacity at risk |
| **WARNING** | Cash tight within 4-6 weeks, fade 3-5%, AR aging past 60 days |
| **WATCH** | Trends moving wrong direction, early indicators |
| **HEALTHY** | On track, no action needed |

---

## Specialist Agent: Job Cost Analyst

**File:** `.pi/agents/job-cost-analyst.md`

### Identity

- **Name:** `job-cost-analyst`
- **Model:** `claude-sonnet`
- **Temperature:** `0.2` (very low — precision-focused)
- **Focus:** Job P&L, cost codes, productivity, change orders, WIP

### Tools Available (6)

`job_cost_summary`, `job_cost_detail`, `productivity_report`, `co_pipeline`, `wip_schedule`, `backlog_report`

### Domain Expertise

**Cost Code Structure:**

| Code Range | Category | Watch For |
|-----------|----------|-----------|
| 1000-1999 | Detailing & Engineering | Hours vs. complexity, RFI churn |
| 2000-2999 | Materials | Mill pricing vs. estimate, waste factor |
| 3000-3999 | Shop Fabrication Labor | Hours/ton, pieces/shift, rework |
| 4000-4999 | Shop Overhead & Equipment | Blast/paint, CNC, handling |
| 5000-5999 | Delivery & Logistics | Loads/week, permits, staging |
| 6000-6999 | Field Erection Labor | Tons/man-day, bolt-up, plumb/align |
| 7000-7999 | Field Equipment | Crane costs, rental vs. owned |
| 8000-8999 | Subcontractors | Decking, misc metals, fireproofing |
| 9000-9999 | General Conditions | Supervision, insurance, bonds |

**Productivity Benchmarks:**

| Metric | Range | Notes |
|--------|-------|-------|
| Shop hours/ton | 15–40 | Simple beams (low) to heavy plate girders (high) |
| Field tons/man-day | 0.5–2.0 | Height, complexity, and access dependent |
| Detailing hours/ton | Varies | Track hours/connection for precision |

**Critical Thresholds:**

| Condition | Level | Action |
|-----------|-------|--------|
| Margin fade > 5% | CRITICAL | Immediate management review, revised estimate |
| Margin fade 3-5% | WARNING | Root cause analysis within one week |
| Underbilling > 10% of contract | WARNING | Billing department must catch up |
| Pending COs > 5% of contract | WARNING | Accelerate documentation and submission |
| Productivity < 65% of estimate | CRITICAL | Stop and reassess approach |

### Analysis Protocol

1. Always start with `job_cost_summary` for big picture
2. Flag fade immediately with specific cost codes
3. Cross-reference tools (cost concern → productivity check → CO pipeline check)
4. Quantify everything with dollar amounts and percentages
5. Recommend specific, actionable steps

---

## Specialist Agent: Treasury Analyst

**File:** `.pi/agents/treasury-analyst.md`

### Identity

- **Name:** `treasury-analyst`
- **Model:** `claude-sonnet`
- **Temperature:** `0.2`
- **Focus:** Cash management, AR/AP, liquidity, forecasting

### Tools Available (4)

`cash_forecast`, `cash_forecast_scenario`, `ar_aging`, `ap_schedule`

### Steel Cash Flow Dynamics

The treasury analyst understands the unique cash timing of steel construction:

```
Timeline: Material → Fabrication → Delivery → Erection → Billing → Collection
          ←── 60-120 days of cash outflow before first collection ──→
```

- **Front-loaded costs**: Mill lead times 8-16 weeks, material purchased months before erection
- **Payroll weekly**: Non-negotiable outflow regardless of collection timing
- **Owner payments lag**: GCs pay 30-45 days after invoice, some stretch to 90 days
- **Retainage**: 5-10% held until substantial completion — trapped cash

### 13-Week Forecast Components

**Inflows:**
- Progress billings (production schedule-based)
- AR collections (customer payment pattern-based)
- Retainage releases (milestone-based)
- Change order billings (approved COs ready to invoice)

**Outflows:**
- Weekly payroll (shop + field + office + burden)
- Material purchases (POs + upcoming orders)
- Subcontractor payments
- Equipment (rental, fuel, maintenance, leases)
- Insurance premiums (GL, WC, auto)
- Bonding premiums
- Debt service (LOC, equipment loans)
- Taxes and overhead

### Scenario Modeling

The treasury analyst proactively runs these scenarios when tight periods are detected:

| Scenario | What-If |
|----------|---------|
| Delayed collection | Largest AR balance pays 30 days late |
| Accelerated material buy | Large mill order for a new job |
| New job mobilization | Cash impact of starting a $2M job |
| Owner payment dispute | $500K invoice held for 60 days |
| Equipment breakdown | Emergency crane rental at $15K/week |
| Seasonal slowdown | Field production drops 40% in winter |

### AR Aging Thresholds

| Aging Bucket | Response |
|-------------|----------|
| Current (0-30) | Normal monitoring |
| 31-60 days | Attention required — follow up |
| 61-90 days | **WARNING** — Escalate, consider stopping work, check lien rights |
| 90+ days | **CRITICAL** — Potential bad debt, assess lien/bond claim |

### AP Strategy Priority (When Cash Is Tight)

1. Payroll and payroll taxes
2. Material suppliers for active jobs
3. Subcontractors with lien rights
4. Equipment with balloon payments
5. Overhead

---

## Specialist Agent: Risk Analyst

**File:** `.pi/agents/risk-analyst.md`

### Identity

- **Name:** `risk-analyst`
- **Model:** `claude-sonnet`
- **Temperature:** `0.2`
- **Focus:** Risk identification, health scoring, early warnings, bonding impact

### Tools Available (4)

`risk_dashboard`, `job_cost_summary`, `ar_aging`, `backlog_report`

### Job Health Scoring Model

| Factor | Weight | Green | Yellow | Red |
|--------|--------|-------|--------|-----|
| Margin Fade | 30% | 0-2% | 2-5% | >5% |
| Billing Position | 20% | Overbilled | Underbilled <5% | >10% |
| Productivity | 20% | >90% of estimate | 75-90% | <75% |
| CO Exposure | 15% | <3% of contract | 3-5% | >5% |
| AR Collection | 15% | Current | 30-60 days | >60 days |

**Composite Scores:**

| Score | Level | Action |
|-------|-------|--------|
| 90-100 | 🟢 GREEN | Normal monitoring |
| 70-89 | 🟡 YELLOW | Weekly review, one+ factors trending wrong |
| 50-69 | 🟠 ORANGE | Immediate management attention, revised estimate may be needed |
| <50 | 🔴 RED | Executive intervention, loss projection likely |

### Five Risk Dimensions

1. **Margin Risk** — Cost overruns, estimate errors, price escalation, rework
2. **Cash Risk** — Collection delays, front-loaded costs, concentration, seasonal compression
3. **Schedule Risk** — Material delays, labor availability, weather, predecessor delays
4. **Customer Risk** — Payment history, financial health, litigation, contract terms
5. **Concentration Risk** — Customer (>30% backlog), geographic, project size (>40% revenue), trade type

### Early Warning System

**Leading Indicators (4-8 weeks ahead of problems):**
- RFI volume spike → scope confusion → cost overruns
- Shop productivity dropping 3+ consecutive weeks
- CO response time from owner exceeding 21 days
- Customer requesting extended payment terms mid-project
- Subcontractor filing preliminary lien notice
- Field overtime exceeding 15% for 2+ weeks

**Lagging Indicators (already happening):**
- Margin fade in monthly cost reports
- AR aging past 60 days
- Increasing underbilling on WIP
- Backlog margin declining quarter over quarter

### Bonding Capacity Impact

A single bad job can reduce bonding capacity by **2-3x the loss amount** (amplification effect). The risk analyst always connects job-level risks to company-level bonding implications:

- **Single job limit**: Typically 10-15% of bonding program
- **Key surety ratios**: Working capital, debt-to-equity, revenue to WC, backlog to equity
- **WIP quality**: Clean WIP with consistent margins strengthens bonding; volatile WIP weakens it

### Risk Report Format

```
RISK:        [Clear description]
SEVERITY:    [CRITICAL / WARNING / WATCH]
EXPOSURE:    [$X,XXX potential financial impact]
PROBABILITY: [HIGH / MEDIUM / LOW]
INDICATORS:  [What signals are you seeing?]
MITIGATION:  [Specific actions]
TIMELINE:    [When must action be taken?]
```

---

## Extension Layer

Extensions provide the tool implementations that agents call. They run in the Pi agent runtime.

### Extension: steelcfo-data

**File:** `extensions/steelcfo-data.ts`

**Purpose:** Data import and querying layer with an in-memory store.

| Tool | Parameters | Returns |
|------|-----------|---------|
| `import_data` | `source` (file path), `type` (dataset category), `format` (csv/json) | Import summary with record count, columns, sample |
| `query_data` | `dataset`, `filters?`, `groupBy?`, `aggregate?`, `fields?` | Filtered/aggregated results |

**Supported Datasets:** `jobs`, `costs`, `ar`, `ap`, `payroll`, `bank`, `change_orders`

**Key Components:**
- `DataStore` — Singleton Map-based in-memory store
- `parseCsv()` — Full CSV parser handling quoted fields, embedded commas, escaped quotes
- `matchesFilters()` — Filter engine with operators: `eq`, `gt`, `lt`, `gte`, `lte`, `contains`
- `aggregateRecords()` — Aggregation engine: `sum`, `avg`, `count`, `min`, `max`

### Extension: steelcfo-calc

**File:** `extensions/steelcfo-calc.ts`

**Purpose:** Job costing, productivity, change orders, WIP, and backlog calculations.

| Tool | Key Computation |
|------|-----------------|
| `job_cost_summary` | POC revenue recognition, projected cost at completion, margin analysis |
| `job_cost_detail` | Cost-code level breakdown with variance analysis |
| `productivity_report` | Hours/ton trending with period comparison and trend detection |
| `co_pipeline` | Change order lifecycle with probability-weighted values |
| `wip_schedule` | Over/under billing with $1,000 tolerance thresholds |
| `backlog_report` | Remaining work with confidence-weighted pipeline |

### Extension: steelcfo-forecast

**File:** `extensions/steelcfo-forecast.ts`

**Purpose:** Cash forecasting, AR/AP analysis, risk scoring, and executive briefings.

| Tool | Key Computation |
|------|-----------------|
| `cash_forecast` | 13-week rolling projection with category-level inflows/outflows |
| `cash_forecast_scenario` | What-if modeling: delayed AR, accelerated AP, new/lost jobs, material increases |
| `ar_aging` | Customer-level aging buckets (current/30/60/90/120+), weighted DSO |
| `ap_schedule` | Weekly payment buckets with critical payments and discount opportunities |
| `risk_dashboard` | Multi-factor scoring: margin fade, AR aging, CO exposure, budget overruns, committed costs |
| `cfo_brief` | Comprehensive executive summary aggregating all financial metrics |

**Financial Constants:**
- Retention: 10%
- Default DSO: 52 days
- Forecast horizon: 13 weeks
- Cost data assumption: 6 months of history

---

## Engine Layer (Pure Functions)

The engine layer (`src/lib/engines/`) contains pure, side-effect-free functions used by both the web app and the extension layer. No database calls, no I/O.

### Type System

**File:** `src/lib/engines/types.ts`

All engine types use plain JavaScript numbers (not Prisma Decimal) and ISO date strings (not Date objects). This is the engine boundary contract.

**Input types:** `Job`, `CostRecord`, `Invoice`, `Bill`, `ChangeOrder`, `PayrollRecord`, `BankAccount`
**Output types:** `JobCostSummary`, `CostCodeDetail`, `WipLine`, `BacklogLine`, `CashForecastWeek`, `ArAgingBucket`, `RiskScore`, `CfoBrief`

### Engine: job-costing.ts

| Function | Inputs | Output | Algorithm |
|----------|--------|--------|-----------|
| `calculateJobCostSummary()` | Jobs, Costs, Invoices, COs | `JobCostSummary[]` | Cost-based POC (actual/budget), projected cost extrapolation at >10% complete, over/under billing |
| `calculateJobCostDetail()` | Job, Costs | Cost codes + totals | Groups by cost code, projected = actual + uncommitted, variance analysis |
| `calculateWipSchedule()` | Jobs, Costs, Invoices, COs | WIP lines + totals | Earned revenue vs. billed, $1,000 tolerance for position classification |
| `calculateBacklog()` | Jobs, Costs, COs | Backlog lines + summary | Monthly burn rate from elapsed time, estimated months remaining |

### Engine: forecasting.ts

| Function | Inputs | Output | Algorithm |
|----------|--------|--------|-----------|
| `calculateCashForecast()` | Bank, Invoices, Bills, Payroll | Weeks + summary | Monday-aligned weeks, due-date matching for AR/AP, 4-week rolling payroll average |
| `calculateArAging()` | Invoices | Buckets + DSO | Due-date-based aging (not invoice date), revenue-weighted DSO over 90-day window |
| `calculateApSchedule()` | Bills | Weekly buckets + totals | 4-week horizon, overdue/upcoming/7-day/30-day classification |

### Engine: risk.ts

| Function | Inputs | Output | Algorithm |
|----------|--------|--------|-----------|
| `calculateRiskScores()` | Jobs, Costs, Invoices, COs | `RiskScore[]` | 4-factor weighted model: margin (35%), AR (25%), CO (20%), budget (20%) |
| `generateCfoBrief()` | All data types | `CfoBrief` | Aggregates cash, AR, AP, risk, portfolio into executive summary with action items |

**Risk Scoring Scale:**

| Score Range | Level | Description |
|-------------|-------|-------------|
| 0-3.9 | Low | Normal operations |
| 4-5.9 | Medium | Monitor closely |
| 6-7.9 | High | Management action required |
| 8-10 | Critical | Executive intervention |

**Risk Factor Thresholds (Engine Implementation):**

| Factor | Score | Condition |
|--------|-------|-----------|
| Margin | 10 | Projected margin < 5% |
| Margin | 7 | Projected margin < 10% |
| Margin | 6 | Margin erosion > 5 points |
| AR | 9 | Overdue > $100K |
| AR | 6 | Overdue > $50K |
| CO | 8 | Pending COs > 10% of contract |
| CO | 5 | More than 3 pending COs |
| Budget | 9 | Actual + committed > 110% of budget |
| Budget | 5 | Actual + committed > 100% of budget |

---

## AI Chat API — The Runtime Bridge

**File:** `src/app/api/chat/route.ts`

The chat API is the bridge between the web application and Claude. It's a POST endpoint that:

1. **Rate limits** — 20 requests/minute per IP (in-memory counter)
2. **Authenticates** — Session-based via NextAuth, bypassed in demo mode
3. **Validates** — Zod schema for messages (1-50 messages, 1-10K chars each)
4. **Fetches data** — `getAllData()` pulls all 7 data types from Prisma
5. **Runs engines** — Executes all 4 engine functions to compute current financial state
6. **Builds system prompt** — Injects live financial data into Claude's context
7. **Streams response** — SSE with abort signal support for client disconnects

### System Prompt Structure

The system prompt includes:

```
[Role Definition]
  → AI CFO for structural steel contractor
  → Deep expertise list (POC, WIP, cost codes, AR aging, etc.)

[Live Financial Data]
  → Executive Summary (cash, AR, AP, active jobs, jobs at risk)
  → Job Cost Summaries (one line per job with key metrics)
  → Risk Scores (one line per job with score, level, factors)
  → AR Aging (bucket totals)
  → Cash Forecast Summary (beginning, ending, minimum, week)

[Response Instructions]
  → Be direct, data-driven, actionable
  → Use specific numbers from the data
  → Recommend concrete steps for risks
  → Format with headers and bullet points
```

### Model Configuration

- **Model:** `claude-sonnet-4-20250514`
- **Max tokens:** 2,048
- **Streaming:** Enabled (SSE)

---

## Data Pipeline

### Database → Engine Boundary

```
PostgreSQL → Prisma ORM → data.ts (type conversion) → Engine Functions → Results
```

**Critical conversions in `src/lib/data.ts`:**

| Prisma Type | Engine Type | Conversion |
|-------------|-------------|------------|
| `Decimal(15,2)` | `number` | `.toNumber()` via `toNumber()` helper |
| `@db.Date` | `string` | `.toISOString().split('T')[0]` → `"YYYY-MM-DD"` |
| `Decimal \| null` | `number` | Null-safe with fallback to 0 |

**Multi-tenancy:** All queries filter by `organizationId` from the authenticated session. Falls back to `"demo-steel-co"` in demo mode.

### CSV → Database (Seed Pipeline)

```
data/sample/*.csv → prisma/seed.ts (parsing + type mapping) → PostgreSQL
```

**7 CSV files seeded:**

| File | Table | Records | Key Mapping |
|------|-------|---------|-------------|
| `jobs.csv` | Job | 8 jobs | status/type enum mapping |
| `costs.csv` | CostRecord | Per cost code per job | Cost code → CostType enum |
| `ar.csv` | Invoice | AR invoices | Status mapping, paid date derivation |
| `ap.csv` | Bill | AP bills | Overhead job fallback (`J-0000`) |
| `change_orders.csv` | ChangeOrder | COs per job | Probability 0-100 → 0-1 |
| `bank.csv` | BankAccount | Account balances | Account name → type derivation |
| `payroll.csv` | PayrollRecord | Weekly payroll | Tons installed calculated from hours/ton |

### Extension Data Flow (Pi Runtime)

```
data/sample/*.csv → import_data tool → DataStore (in-memory Map) → query_data / analysis tools
```

The Pi extensions use an independent in-memory store (`DataStore` singleton) separate from Prisma. Data must be imported via the `import_data` tool before analysis tools can function.

---

## Prompt Templates

**Directory:** `.pi/prompts/`

| Prompt | File | Purpose |
|--------|------|---------|
| CFO Brief | `cfo-brief.md` | Generate a weekly executive financial briefing |
| Job Review | `job-review.md` | Deep-dive analysis of a specific job |
| Bid Decision | `bid-decision.md` | Evaluate a new bid opportunity |
| Cash Scenario | `cash-scenario.md` | Run what-if scenarios on cash position |

These prompts provide structured templates that agents can follow for common workflows.

---

## Skills

**Directory:** `.pi/skills/`

| Skill | File | Purpose |
|-------|------|---------|
| CFO Brief | `cfo-brief/skill.yaml` | Orchestrates the full CFO briefing workflow |
| Job Costing | `job-costing/skill.yaml` | Structured job cost analysis sequence |
| Cash Forecast | `cash-forecast/skill.yaml` | 13-week forecast generation with scenarios |
| Risk Engine | `risk-engine/skill.yaml` | Risk assessment and early warning workflow |

Skills define multi-step workflows that chain tool calls together in a prescribed sequence.

---

## Theme & Presentation

**File:** `.pi/themes/steelcfo.json`

The Pi TUI uses a custom SteelCFO theme matching the web app's cyber/HUD aesthetic. This ensures a consistent visual experience when running agents locally.

The web application uses a custom Tailwind theme defined in `tailwind.config.ts`:

- **Color palette:** Neon cyan (`#00FFFF`), neon green (`#00FF41`), neon magenta (`#FF00FF`), neon red (`#FF0040`)
- **Fonts:** JetBrains Mono (body/data), Orbitron (display/headers)
- **Animations:** Scan lines, glow pulses, tron glows, data streams
- **Dark mode:** Pure black backgrounds with neon accents

---

## Security Model

### Web Application Security

| Layer | Implementation |
|-------|---------------|
| **Authentication** | NextAuth v5, JWT strategy, bcryptjs password hashing |
| **Authorization** | Middleware protects all `/dashboard/*` and `/api/*` routes |
| **Rate Limiting** | 20 req/min per IP on chat endpoint (in-memory) |
| **Input Validation** | Zod schemas on all API inputs |
| **XSS Protection** | HTML entity escaping + tag allowlisting in chat renderer |
| **Security Headers** | CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Permissions-Policy |
| **Multi-Tenancy** | All DB queries scoped by `organizationId` |
| **Demo Mode** | `DEMO_MODE=true` bypasses auth for evaluation — never use in production |

### Agent Security

- Extensions run locally — no network access to production data
- Tool functions validate all parameters before execution
- Financial data in the in-memory store is session-scoped
- System prompts never include credentials or connection strings

---

## Adding a New Agent or Tool

### Adding a New Agent

1. Create `.pi/agents/{name}.md` with YAML frontmatter:
   ```yaml
   ---
   name: new-agent
   description: What this agent does
   model: claude-sonnet
   tools:
     - tool_name_1
     - tool_name_2
   temperature: 0.2
   ---
   ```
2. Write the system prompt in the markdown body
3. Add the agent to `.pi/agents/teams.yaml` under the appropriate team
4. Add routing patterns for the new agent's domain

### Adding a New Tool

1. Implement the function in the appropriate extension file (`extensions/steelcfo-*.ts`)
2. Export it in the `tools` array at the bottom of the file with:
   - `name` — snake_case identifier
   - `description` — What the tool does (agents read this to decide when to call it)
   - `parameters` — JSON Schema for inputs
   - `execute` — Reference to the implementation function
3. Add the tool name to the relevant agent(s) in their `.md` frontmatter
4. If the tool computes financial metrics, consider also adding a pure function to `src/lib/engines/`

### Adding a New Engine Function

1. Add the function to the appropriate engine file (`src/lib/engines/*.ts`)
2. Define input/output types in `src/lib/engines/types.ts`
3. Ensure the function is **pure** — no DB calls, no side effects, no Date.now()
4. Accept engine types (plain numbers, string dates), not Prisma types
5. If the function should feed the AI chat, integrate it in `src/app/api/chat/route.ts`

---

## Debugging & Troubleshooting

### Web App Chat Issues

| Symptom | Check |
|---------|-------|
| Chat returns "AI not configured" | `ANTHROPIC_API_KEY` not set in `.env` |
| Chat returns 401 | `DEMO_MODE` is not `"true"` and no session exists |
| Chat returns 429 | Rate limited — wait 60 seconds |
| Chat hangs/no response | Check Claude API status, verify model name is valid |
| Chat shows wrong data | Check `organizationId` resolution, verify seed data |
| SSE stream cuts off | Client disconnected or abort signal fired |

### Pi Agent Issues

| Symptom | Check |
|---------|-------|
| "dataset not found" | Data not imported — run `import_data` first |
| Agent gives wrong answer | Check tool output → is the data loaded correctly? |
| Agent doesn't route | Check pattern matching in `teams.yaml` |
| Tool throws error | Missing required parameter — check tool schema |

### Engine Debugging

All engines are pure functions — test them in isolation:

```typescript
import { calculateRiskScores } from '@/lib/engines/risk'

const result = calculateRiskScores(mockJobs, mockCosts, mockInvoices, mockCOs)
console.log(JSON.stringify(result, null, 2))
```

---

## Domain Knowledge Reference

### Steel Construction Financial Glossary

| Term | Definition |
|------|-----------|
| **POC** | Percentage-of-completion — revenue recognition based on costs incurred vs. estimated total cost |
| **WIP** | Work-in-progress schedule — shows earned vs. billed for each job |
| **Overbilled** | Billed more than earned — means you collected cash ahead of work (positive for cash) |
| **Underbilled** | Earned more than billed — means you're owed money for work performed (negative for cash) |
| **Fade** | Margin erosion — when projected final margin is less than original estimate |
| **Gain** | Margin improvement — when projected final margin exceeds original estimate |
| **DSO** | Days Sales Outstanding — average collection period in days |
| **Retainage** | 5-10% of each invoice withheld by owner until project completion |
| **Bonding** | Surety bond guaranteeing project completion — capacity is based on financial health |
| **EAC** | Estimate at Completion — projected total cost when job is finished |
| **CO** | Change Order — modification to original contract scope and/or price |
| **Burn Rate** | Monthly rate of cost expenditure on a job or across the portfolio |
| **Backlog** | Total remaining contract value on active and pending jobs |
| **Joint Check** | Check made payable to both contractor and supplier — slows cash cycle |
| **Lien Rights** | Legal claim against property for unpaid work — time-limited, jurisdiction-specific |
| **Hours/Ton** | Primary productivity metric in steel — lower is better |
| **Tons/Man-Day** | Field erection productivity — higher is better |

### Typical Steel Job Cost Breakdown

| Category | % of Total Cost | Notes |
|----------|-----------------|-------|
| Materials | 35-45% | Steel, connections, bolts, misc metals |
| Shop Labor | 15-25% | Fabrication, welding, assembly |
| Field Labor | 15-25% | Erection, bolt-up, plumb/align |
| Equipment | 5-10% | Cranes, lifts, welding machines |
| Engineering | 5-8% | Detailing, PE stamping |
| Subcontractors | 5-15% | Decking, fireproofing, coatings |
| General Conditions | 3-5% | Supervision, insurance, bonds |

---

*This document is maintained alongside the codebase. When agents, tools, or engines change, update this file to keep it accurate.*
