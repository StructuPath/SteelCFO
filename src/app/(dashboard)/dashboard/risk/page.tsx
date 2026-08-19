import { getAllData } from "@/lib/data"
import { calculateRiskScores } from "@/lib/engines/risk"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { RiskTable } from "@/components/risk-table"
import { MetricCard } from "@/components/metric-card"

export const dynamic = "force-dynamic"

export default async function RiskPage() {
  const data = await getAllData()
  const risks = calculateRiskScores(
    data.jobs,
    data.costs,
    data.invoices,
    data.changeOrders
  )

  const criticalRisk = risks.filter(
    (r) => r.riskLevel === "critical"
  ).length
  const highRisk = risks.filter(
    (r) => r.riskLevel === "high"
  ).length
  const medRisk = risks.filter(
    (r) => r.riskLevel === "medium"
  ).length
  const lowRisk = risks.filter(
    (r) => r.riskLevel === "low"
  ).length
  const avgScore =
    risks.length > 0
      ? risks.reduce(
          (s, r) => s + r.overallScore,
          0
        ) / risks.length
      : 0

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="mb-1 flex items-center gap-3">
          <span className="text-xl text-neon-red">
            ⚡
          </span>
          <h1 className="font-display text-xl font-bold uppercase tracking-[0.15em] text-neon-red text-glow-red">
            Threat Engine
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-px w-4 bg-neon-red/30" />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-hud-dim">
            Multi-factor risk analysis across all
            active targets
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="High / Critical"
          value={`${highRisk + criticalRisk}`}
          subtitle="Score ≥ 6.0"
          icon="⚡"
        />
        <MetricCard
          title="Medium Risk"
          value={`${medRisk}`}
          subtitle="Score 4.0 – 5.9"
          icon="▣"
        />
        <MetricCard
          title="Low Risk"
          value={`${lowRisk}`}
          subtitle="Score < 4.0"
          icon="◈"
        />
        <MetricCard
          title="Avg Risk Score"
          value={avgScore.toFixed(1)}
          subtitle="Average across active jobs"
          icon="◇"
        />
      </div>

      {/* Risk table */}
      <RiskTable risks={risks} />

      {/* Risk methodology */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="text-neon-cyan">◇</span>
            <CardTitle>Risk Methodology</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 rounded-sm border border-grid-dim bg-cyber-deep/40 p-3">
              <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-neon-cyan">
                Margin Risk (35%)
              </p>
              <p className="font-mono text-[10px] leading-relaxed text-hud-muted">
                Projected margin vs original estimate.
                Flags margin below 10% or significant
                erosion.
              </p>
            </div>
            <div className="space-y-2 rounded-sm border border-grid-dim bg-cyber-deep/40 p-3">
              <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-neon-green">
                AR Risk (25%)
              </p>
              <p className="font-mono text-[10px] leading-relaxed text-hud-muted">
                Overdue receivables by amount. Higher
                score for amounts over $100K past due.
              </p>
            </div>
            <div className="space-y-2 rounded-sm border border-grid-dim bg-cyber-deep/40 p-3">
              <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-neon-magenta">
                CO Risk (20%)
              </p>
              <p className="font-mono text-[10px] leading-relaxed text-hud-muted">
                Pending change orders as % of contract.
                Flags when pending COs exceed 10%.
              </p>
            </div>
            <div className="space-y-2 rounded-sm border border-grid-dim bg-cyber-deep/40 p-3">
              <p className="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-neon-orange">
                Budget Risk (20%)
              </p>
              <p className="font-mono text-[10px] leading-relaxed text-hud-muted">
                Total exposure (actual + committed) vs
                original budget. Flags overruns &gt;
                10%.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
