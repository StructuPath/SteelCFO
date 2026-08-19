import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { RiskScore } from "@/lib/engines/types"

interface RiskTableProps {
  risks: RiskScore[]
}

function ScoreBar({
  value,
  max = 10,
}: {
  value: number
  max?: number
}) {
  const pct = (value / max) * 100
  const color =
    value >= 7
      ? "bg-neon-red shadow-[0_0_6px_rgba(255,0,64,0.5)]"
      : value >= 4
        ? "bg-neon-orange shadow-[0_0_6px_rgba(255,107,0,0.5)]"
        : "bg-neon-green shadow-[0_0_6px_rgba(0,255,65,0.5)]"
  return (
    <div className="flex items-center gap-2">
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className="h-1 w-12 overflow-hidden rounded-full bg-cyber-surface"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="font-mono text-[10px] tabular-nums text-hud-muted">
        {value}
      </span>
    </div>
  )
}

function riskVariant(level: string) {
  if (level === "critical" || level === "high")
    return "danger" as const
  if (level === "medium") return "warning" as const
  return "success" as const
}

export function RiskTable({ risks }: RiskTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-neon-red">⚡</span>
          <CardTitle>Threat Matrix</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Target</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Margin</TableHead>
              <TableHead>A/R</TableHead>
              <TableHead>C/O</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Threat Vectors</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {risks.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center text-hud-dim"
                >
                  No active jobs to score.
                </TableCell>
              </TableRow>
            ) : (
              risks.map((risk) => (
                <TableRow
                  key={risk.jobId}
                  className={
                    risk.riskLevel === "high" ||
                    risk.riskLevel === "critical"
                      ? "bg-neon-red/[0.02]"
                      : ""
                  }
                >
                  <TableCell>
                    <div>
                      <p className="text-xs font-semibold text-neon-cyan">
                        {risk.jobId}
                      </p>
                      <p className="text-[9px] text-hud-dim">
                        {risk.jobName}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "font-display text-lg font-bold tabular-nums",
                        risk.overallScore >= 7
                          ? "text-neon-red text-glow-red"
                          : risk.overallScore >= 4
                            ? "text-neon-orange text-glow-orange"
                            : "text-neon-green text-glow-green"
                      )}
                    >
                      {risk.overallScore.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={riskVariant(
                        risk.riskLevel
                      )}
                    >
                      {risk.riskLevel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <ScoreBar value={risk.marginRisk} />
                  </TableCell>
                  <TableCell>
                    <ScoreBar value={risk.arRisk} />
                  </TableCell>
                  <TableCell>
                    <ScoreBar value={risk.coRisk} />
                  </TableCell>
                  <TableCell>
                    <ScoreBar value={risk.budgetRisk} />
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px]">
                      {risk.factors
                        .slice(0, 2)
                        .map((f, i) => (
                          <p
                            key={i}
                            className="truncate text-[9px] text-hud-dim"
                          >
                            {f}
                          </p>
                        ))}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
