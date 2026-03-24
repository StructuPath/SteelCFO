import { getAllData } from "@/lib/data"
import { generateCfoBrief } from "@/lib/engines/risk"
import { calculateCashForecast } from "@/lib/engines/forecasting"
import { calculateRiskScores } from "@/lib/engines/risk"
import { MetricCard } from "@/components/metric-card"
import { CashForecastChart } from "@/components/charts/cash-forecast-chart"
import { RiskTable } from "@/components/risk-table"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
  const data = await getAllData()
  const brief = generateCfoBrief(
    data.jobs,
    data.costs,
    data.invoices,
    data.bills,
    data.changeOrders,
    data.payroll,
    data.bankAccounts
  )
  const forecast = calculateCashForecast(
    data.bankAccounts,
    data.invoices,
    data.bills,
    data.payroll
  )
  const risks = calculateRiskScores(
    data.jobs,
    data.costs,
    data.invoices,
    data.changeOrders
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="mb-1 flex items-center gap-3">
          <span className="text-xl text-neon-cyan">
            ⬡
          </span>
          <h1 className="font-display text-xl font-bold uppercase tracking-[0.15em] text-neon-cyan text-glow-cyan">
            Command Center
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-px w-4 bg-neon-cyan/30" />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-hud-dim">
            Weekly CFO Brief —{" "}
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Cash Position"
          value={formatCurrency(
            brief.cashPosition.totalCash
          )}
          subtitle={`${formatCurrency(brief.cashPosition.totalLiquidity)} total liquidity`}
          icon="◇"
        />
        <MetricCard
          title="AR Outstanding"
          value={formatCurrency(
            brief.receivables.totalOutstanding
          )}
          subtitle={`DSO: ${brief.receivables.dso} days`}
          trend={
            brief.receivables.overduePercent > 20
              ? {
                  value: `${brief.receivables.overduePercent.toFixed(0)}% overdue`,
                  positive: false,
                }
              : undefined
          }
          icon="▷"
        />
        <MetricCard
          title="AP Due // 7 Days"
          value={formatCurrency(
            brief.payables.dueNext7Days
          )}
          subtitle={`${formatCurrency(brief.payables.totalOutstanding)} total outstanding`}
          icon="◁"
        />
        <MetricCard
          title="Threat Level"
          value={`${brief.portfolio.jobsAtRisk}`}
          subtitle={`of ${brief.portfolio.activeJobs} active targets`}
          trend={
            brief.portfolio.jobsAtRisk > 0
              ? {
                  value: `${brief.portfolio.weightedMargin.toFixed(1)}% weighted margin`,
                  positive:
                    brief.portfolio.weightedMargin >
                    10,
                }
              : undefined
          }
          icon="⚡"
        />
      </div>

      {/* Cash Forecast + Action Items */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CashForecastChart
            weeks={forecast.weeks}
          />
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="text-neon-orange">
                ▣
              </span>
              <CardTitle>Priority Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {brief.actionItems.length > 0 ? (
                brief.actionItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 rounded-sm border border-grid-dim bg-cyber-deep/60 p-3"
                  >
                    <span className="mt-0.5 text-xs text-neon-cyan">
                      ▸
                    </span>
                    <p className="font-mono text-xs text-hud-text">
                      {item}
                    </p>
                  </div>
                ))
              ) : (
                <p className="font-mono text-xs text-hud-dim">
                  No critical actions required.
                </p>
              )}
              {brief.topRisks.length > 0 && (
                <div className="mt-4 border-t border-grid-dim pt-4">
                  <p className="mb-2 font-mono text-[9px] font-medium uppercase tracking-[0.2em] text-hud-dim">
                    {"// THREAT VECTORS"}
                  </p>
                  {brief.topRisks.map(
                    (risk, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 py-1"
                      >
                        <Badge
                          variant="danger"
                          className="mt-0.5 text-[8px]"
                        >
                          {i + 1}
                        </Badge>
                        <p className="font-mono text-[10px] text-hud-muted">
                          {risk}
                        </p>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Table */}
      <RiskTable risks={risks} />

      {/* Bottom Cards */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="text-neon-green">◈</span>
              <CardTitle>Portfolio Matrix</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(
                [
                  [
                    "Active Jobs",
                    brief.portfolio.activeJobs.toString(),
                  ],
                  [
                    "Total Contract Value",
                    formatCurrency(
                      brief.portfolio
                        .totalContractValue
                    ),
                  ],
                  [
                    "Total Backlog",
                    formatCurrency(
                      brief.portfolio.totalBacklog
                    ),
                  ],
                  [
                    "Weighted Margin",
                    `${brief.portfolio.weightedMargin.toFixed(1)}%`,
                  ],
                ] as const
              ).map(([label, val]) => (
                <div
                  key={label}
                  className="flex items-center justify-between"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-hud-muted">
                    {label}
                  </span>
                  <span className="font-mono text-xs font-medium text-hud-text">
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <span className="text-neon-cyan">◇</span>
              <CardTitle>Cash Forecast</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(
                [
                  [
                    "Beginning Cash",
                    formatCurrency(
                      forecast.summary.beginningCash
                    ),
                    false,
                  ],
                  [
                    "Ending Cash (13 wk)",
                    formatCurrency(
                      forecast.summary.endingCash
                    ),
                    false,
                  ],
                  [
                    "Minimum Balance",
                    formatCurrency(
                      forecast.summary.minBalance
                    ),
                    forecast.summary.minBalance < 0,
                  ],
                  [
                    "Min Balance Week",
                    `Week ${forecast.summary.minBalanceWeek}`,
                    false,
                  ],
                ] as const
              ).map(([label, val, isDanger]) => (
                <div
                  key={label}
                  className="flex items-center justify-between"
                >
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-hud-muted">
                    {label}
                  </span>
                  <span
                    className={`font-mono text-xs font-medium ${isDanger ? "text-neon-red text-glow-red" : "text-hud-text"}`}
                  >
                    {val}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
