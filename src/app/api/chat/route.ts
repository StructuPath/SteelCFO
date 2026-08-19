import { NextRequest } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"
import { auth } from "@/auth"
import { getAllData } from "@/lib/data"
import { calculateJobCostSummary } from "@/lib/engines/job-costing"
import {
  calculateArAging,
  calculateCashForecast,
} from "@/lib/engines/forecasting"
import {
  calculateRiskScores,
  generateCfoBrief,
} from "@/lib/engines/risk"

export const runtime = "nodejs"
export const maxDuration = 60

// --- Input validation ---
const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(10000),
})

const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(50),
})

// --- Simple in-memory rate limiter ---
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_REQUESTS = 20
const RATE_LIMIT_SWEEP_THRESHOLD = 1_000

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  // Prune expired entries so the map can't grow without bound
  if (rateLimitMap.size > RATE_LIMIT_SWEEP_THRESHOLD) {
    for (const [key, value] of rateLimitMap) {
      if (now > value.resetAt) rateLimitMap.delete(key)
    }
  }
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT_MAX_REQUESTS
}

function buildSystemPrompt(
  jobSummaries: ReturnType<typeof calculateJobCostSummary>,
  arAging: ReturnType<typeof calculateArAging>,
  cashForecast: ReturnType<typeof calculateCashForecast>,
  riskScores: ReturnType<typeof calculateRiskScores>,
  brief: ReturnType<typeof generateCfoBrief>
): string {
  const jobLines = jobSummaries
    .map(
      (j) =>
        `- ${j.jobId} ${j.jobName}: Contract $${j.revisedContract.toLocaleString()}, Cost $${j.costToDate.toLocaleString()}, Margin ${j.projectedMarginPct.toFixed(1)}%, ${j.percentComplete.toFixed(0)}% complete, O/U Billing $${j.overUnderBilling.toLocaleString()}`
    )
    .join("\n")

  const riskLines = riskScores
    .map(
      (r) =>
        `- ${r.jobId} ${r.jobName}: Score ${r.overallScore}/10 (${r.riskLevel})${r.factors.length > 0 ? " - " + r.factors.join("; ") : ""}`
    )
    .join("\n")

  return `You are the AI Chief Financial Officer for a structural steel fabrication and erection contractor. Your three guiding principles are: Protect Cash, Protect Margin, Reduce Surprises.

You have deep expertise in:
- Percentage-of-completion (POC) accounting
- WIP (Work-in-Progress) schedules and over/under billing
- Cost code analysis (materials, labor, equipment, subs, engineering, coatings)
- 13-week rolling cash forecasts
- AR aging and collections management
- AP scheduling and vendor payment optimization
- Risk scoring and early warning systems
- Steel industry metrics (hours/ton, tonnage tracking)
- Bonding capacity and surety relationships
- Change order management and lien rights

CURRENT FINANCIAL DATA:
======================

EXECUTIVE SUMMARY:
- Cash Position: $${brief.cashPosition.totalCash.toLocaleString()} ($${brief.cashPosition.totalLiquidity.toLocaleString()} total liquidity)
- AR Outstanding: $${brief.receivables.totalOutstanding.toLocaleString()} (DSO: ${brief.receivables.dso} days, ${brief.receivables.overduePercent.toFixed(0)}% overdue)
- AP Outstanding: $${brief.payables.totalOutstanding.toLocaleString()} ($${brief.payables.dueNext7Days.toLocaleString()} due this week)
- Active Jobs: ${brief.portfolio.activeJobs} (${brief.portfolio.weightedMargin.toFixed(1)}% weighted margin)
- Jobs at Risk: ${brief.portfolio.jobsAtRisk}

JOB COST SUMMARIES:
${jobLines}

RISK SCORES:
${riskLines}

AR AGING:
- Current: $${arAging.totals.current.toLocaleString()}
- 1-30 days: $${arAging.totals.days30.toLocaleString()}
- 31-60 days: $${arAging.totals.days60.toLocaleString()}
- 61-90 days: $${arAging.totals.days90.toLocaleString()}
- 90+ days: $${arAging.totals.days120Plus.toLocaleString()}

CASH FORECAST (13-week):
- Beginning: $${cashForecast.summary.beginningCash.toLocaleString()}
- Projected Ending: $${cashForecast.summary.endingCash.toLocaleString()}
- Minimum Balance: $${cashForecast.summary.minBalance.toLocaleString()} (Week ${cashForecast.summary.minBalanceWeek})

Respond as a seasoned CFO. Be direct, data-driven, and actionable. Use specific numbers from the data above. When discussing risks, recommend concrete steps. Format responses with headers and bullet points for clarity.`
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown"
    if (isRateLimited(ip)) {
      return Response.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      )
    }

    // Authentication check
    const session = await auth()
    if (!session && process.env.DEMO_MODE !== "true") {
      return Response.json(
        { error: "Authentication required." },
        { status: 401 }
      )
    }

    // Input validation
    const body = await req.json()
    const parsed = ChatRequestSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { error: "Invalid request format." },
        { status: 400 }
      )
    }
    const { messages } = parsed.data

    // Resolve organization from session
    const orgId = session?.user?.organizationId

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) {
      return Response.json(
        { error: "AI chat is not configured. Please contact the administrator." },
        { status: 500 }
      )
    }

    // Fetch all financial data and compute summaries
    const data = await getAllData(orgId)

    const jobSummaries = calculateJobCostSummary(
      data.jobs,
      data.costs,
      data.invoices,
      data.changeOrders
    )
    const arAging = calculateArAging(data.invoices)
    const cashForecast = calculateCashForecast(
      data.bankAccounts,
      data.invoices,
      data.bills,
      data.payroll
    )
    const riskScores = calculateRiskScores(
      data.jobs,
      data.costs,
      data.invoices,
      data.changeOrders
    )
    const brief = generateCfoBrief(
      data.jobs,
      data.costs,
      data.invoices,
      data.bills,
      data.changeOrders,
      data.payroll,
      data.bankAccounts
    )

    const systemPrompt = buildSystemPrompt(
      jobSummaries,
      arAging,
      cashForecast,
      riskScores,
      brief
    )

    const client = new Anthropic({ apiKey })

    const model = process.env.ANTHROPIC_MODEL || "claude-opus-5"
    const anthropicMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    // Server-side refusal fallbacks are supported on the Opus 5 / Fable 5 tier
    const supportsServerFallback =
      model === "claude-opus-5" || model === "claude-fable-5"

    const response = supportsServerFallback
      ? await client.beta.messages.create({
          model,
          max_tokens: 4096,
          system: systemPrompt,
          messages: anthropicMessages,
          stream: true,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
        })
      : await client.messages.create({
          model,
          max_tokens: 4096,
          system: systemPrompt,
          messages: anthropicMessages,
          stream: true,
        })

    // Stream the response as SSE with abort signal support
    const abortSignal = req.signal
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of response) {
            // Stop streaming if client disconnected
            if (abortSignal.aborted) {
              controller.close()
              return
            }
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const chunk = `data: ${JSON.stringify({ text: event.delta.text })}\n\n`
              controller.enqueue(
                encoder.encode(chunk)
              )
            }
          }
          controller.enqueue(
            encoder.encode("data: [DONE]\n\n")
          )
          controller.close()
        } catch (err) {
          if (abortSignal.aborted) {
            controller.close()
          } else {
            controller.error(err)
          }
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return Response.json(
      { error: "An internal error occurred. Please try again." },
      { status: 500 }
    )
  }
}
