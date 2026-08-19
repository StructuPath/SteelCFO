import { getAllData } from "@/lib/data"
import { calculateJobCostSummary } from "@/lib/engines/job-costing"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function JobsPage() {
  const data = await getAllData()
  const summaries = calculateJobCostSummary(
    data.jobs,
    data.costs,
    data.invoices,
    data.changeOrders
  )

  const statusVariant = (s: string) => {
    switch (s) {
      case "active":
        return "success" as const
      case "complete":
        return "secondary" as const
      case "pending":
        return "warning" as const
      default:
        return "outline" as const
    }
  }

  const totalContract = summaries.reduce(
    (s, j) => s + j.revisedContract,
    0
  )
  const totalCost = summaries.reduce(
    (s, j) => s + j.costToDate,
    0
  )
  const totalMargin = summaries.reduce(
    (s, j) => s + j.projectedMargin,
    0
  )
  const avgMarginPct =
    totalContract > 0
      ? (totalMargin / totalContract) * 100
      : 0

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-3">
          <span className="text-xl text-neon-cyan">
            ◈
          </span>
          <h1 className="font-display text-xl font-bold uppercase tracking-[0.15em] text-neon-cyan text-glow-cyan">
            Project Matrix
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-px w-4 bg-neon-cyan/30" />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-hud-dim">
            Cost tracking and margin analysis across
            all targets
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {(
          [
            {
              label: "Tracked Jobs",
              value: `${summaries.length}`,
              color: "",
            },
            {
              label: "Contract Value",
              value: formatCurrency(totalContract),
              color: "",
            },
            {
              label: "Cost to Date",
              value: formatCurrency(totalCost),
              color: "",
            },
            {
              label: "Avg Margin",
              value: `${avgMarginPct.toFixed(1)}%`,
              color:
                avgMarginPct >= 10
                  ? "text-neon-green text-glow-green"
                  : avgMarginPct >= 5
                    ? "text-neon-orange"
                    : "text-neon-red text-glow-red",
            },
          ] as const
        ).map((m) => (
          <Card key={m.label}>
            <CardContent className="p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-hud-muted">
                {m.label}
              </p>
              <p
                className={`font-display text-2xl font-bold ${m.color || "text-hud-text"}`}
              >
                {m.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="text-right">
                  Contract
                </TableHead>
                <TableHead className="text-right">
                  Cost
                </TableHead>
                <TableHead className="text-right">
                  Margin
                </TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="text-right">
                  O/U Billing
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summaries.map((job) => {
                const j = data.jobs.find(
                  (x) => x.id === job.jobId
                )
                return (
                  <TableRow key={job.jobId}>
                    <TableCell>
                      <Link
                        href={`/dashboard/jobs/${job.jobId}`}
                        className="font-semibold text-neon-cyan hover:text-neon-cyan/80 hover:underline"
                      >
                        {job.jobId}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">
                      {job.jobName}
                    </TableCell>
                    <TableCell>
                      {job.customer}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariant(
                          j?.status ?? "active"
                        )}
                      >
                        {j?.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] uppercase">
                      {j?.type}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(
                        job.revisedContract
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(job.costToDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          job.projectedMarginPct >= 10
                            ? "text-neon-green"
                            : job.projectedMarginPct >=
                                5
                              ? "text-neon-orange"
                              : "text-neon-red"
                        }
                      >
                        {job.projectedMarginPct.toFixed(
                          1
                        )}
                        %
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={
                            job.percentComplete
                          }
                          variant={
                            job.percentComplete > 80
                              ? "success"
                              : "default"
                          }
                          className="w-14"
                        />
                        <span className="font-mono text-[10px] tabular-nums text-hud-dim">
                          {job.percentComplete.toFixed(
                            0
                          )}
                          %
                        </span>
                      </div>
                    </TableCell>
                    <TableCell
                      className={`text-right tabular-nums ${job.overUnderBilling >= 0 ? "text-neon-green" : "text-neon-red"}`}
                    >
                      {formatCurrency(
                        job.overUnderBilling
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
