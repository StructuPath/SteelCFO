import { getAllData } from "@/lib/data"
import {
  calculateJobCostSummary,
  calculateJobCostDetail,
} from "@/lib/engines/job-costing"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { formatCurrency } from "@/lib/utils"
import Link from "next/link"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>
}) {
  const { jobId } = await params
  const data = await getAllData()
  const job = data.jobs.find((j) => j.id === jobId)
  if (!job) notFound()

  const [summary] = calculateJobCostSummary(
    data.jobs,
    data.costs,
    data.invoices,
    data.changeOrders,
    jobId
  )
  const detail = calculateJobCostDetail(
    job,
    data.costs
  )
  const jobCOs = data.changeOrders.filter(
    (co) => co.jobId === jobId
  )
  const jobInvoices = data.invoices.filter(
    (i) => i.jobId === jobId
  )

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/jobs"
        className="inline-flex items-center gap-2 font-mono text-xs text-hud-muted transition-colors hover:text-neon-cyan"
      >
        <span>◂</span> BACK TO MATRIX
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <h1 className="font-display text-xl font-bold uppercase tracking-[0.1em] text-neon-cyan text-glow-cyan">
              {job.id} {"//"}  {job.name}
            </h1>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-hud-dim">
            {job.customer} · {job.type} · {job.tons}{" "}
            tons
          </p>
        </div>
        <Badge
          variant={
            job.status === "active"
              ? "success"
              : job.status === "complete"
                ? "secondary"
                : "warning"
          }
        >
          {job.status}
        </Badge>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="hud-corners">
            <CardContent className="p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-hud-muted">
                Revised Contract
              </p>
              <p className="font-display text-xl font-bold text-hud-text">
                {formatCurrency(
                  summary.revisedContract
                )}
              </p>
              {summary.approvedChanges !== 0 && (
                <p className="font-mono text-[10px] text-neon-green">
                  +
                  {formatCurrency(
                    summary.approvedChanges
                  )}{" "}
                  COs
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="hud-corners">
            <CardContent className="p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-hud-muted">
                Cost to Date
              </p>
              <p className="font-display text-xl font-bold text-hud-text">
                {formatCurrency(summary.costToDate)}
              </p>
              <p className="font-mono text-[10px] text-hud-dim">
                {formatCurrency(
                  summary.committedCost
                )}{" "}
                committed
              </p>
            </CardContent>
          </Card>
          <Card className="hud-corners">
            <CardContent className="p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-hud-muted">
                Projected Margin
              </p>
              <p
                className={`font-display text-xl font-bold ${
                  summary.projectedMarginPct >= 10
                    ? "text-neon-green text-glow-green"
                    : summary.projectedMarginPct >= 5
                      ? "text-neon-orange"
                      : "text-neon-red text-glow-red"
                }`}
              >
                {summary.projectedMarginPct.toFixed(
                  1
                )}
                %
              </p>
              <p className="font-mono text-[10px] text-hud-dim">
                {formatCurrency(
                  summary.projectedMargin
                )}
              </p>
            </CardContent>
          </Card>
          <Card className="hud-corners">
            <CardContent className="p-4">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-hud-muted">
                Over/Under Billing
              </p>
              <p
                className={`font-display text-xl font-bold ${
                  summary.overUnderBilling >= 0
                    ? "text-neon-green"
                    : "text-neon-red"
                }`}
              >
                {formatCurrency(
                  summary.overUnderBilling
                )}
              </p>
              <Progress
                value={summary.percentComplete}
                className="mt-2"
              />
              <p className="mt-1 font-mono text-[10px] text-hud-dim">
                {summary.percentComplete.toFixed(0)}%
                complete
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cost Code Analysis</CardTitle>
          <CardDescription>
            Budget vs actual by cost code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">
                  Budget
                </TableHead>
                <TableHead className="text-right">
                  Actual
                </TableHead>
                <TableHead className="text-right">
                  Committed
                </TableHead>
                <TableHead className="text-right">
                  Projected
                </TableHead>
                <TableHead className="text-right">
                  Variance
                </TableHead>
                <TableHead>Consumed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.costCodes.map((cc) => (
                <TableRow key={cc.costCode}>
                  <TableCell className="font-mono font-semibold text-neon-cyan">
                    {cc.costCode}
                  </TableCell>
                  <TableCell>
                    {cc.description}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(cc.budgetAmount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(cc.actualToDate)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(
                      cc.committedNotInvoiced
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(
                      cc.projectedAtCompletion
                    )}
                  </TableCell>
                  <TableCell
                    className={`text-right tabular-nums ${cc.varianceToBudget >= 0 ? "text-neon-green" : "text-neon-red"}`}
                  >
                    {formatCurrency(
                      cc.varianceToBudget
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={cc.percentUsed}
                        variant={
                          cc.percentUsed > 100
                            ? "danger"
                            : cc.percentUsed > 80
                              ? "warning"
                              : "default"
                        }
                        className="w-14"
                      />
                      <span className="font-mono text-[10px] tabular-nums text-hud-dim">
                        {cc.percentUsed.toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="font-semibold"
                >
                  TOTALS
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatCurrency(
                    detail.totals.budget
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatCurrency(
                    detail.totals.actual
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatCurrency(
                    detail.totals.committed
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatCurrency(
                    detail.totals.projected
                  )}
                </TableCell>
                <TableCell
                  className={`text-right font-semibold tabular-nums ${detail.totals.variance >= 0 ? "text-neon-green" : "text-neon-red"}`}
                >
                  {formatCurrency(
                    detail.totals.variance
                  )}
                </TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Change Orders</CardTitle>
          </CardHeader>
          <CardContent>
            {jobCOs.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>CO #</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">
                      Amount
                    </TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobCOs.map((co) => (
                    <TableRow key={co.id}>
                      <TableCell className="font-mono text-neon-cyan">
                        {co.id}
                      </TableCell>
                      <TableCell>
                        {co.description}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(co.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            co.status === "approved"
                              ? "success"
                              : co.status ===
                                  "pending"
                                ? "warning"
                                : "danger"
                          }
                        >
                          {co.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="font-mono text-xs text-hud-dim">
                No change orders logged
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {jobInvoices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead className="text-right">
                      Amount
                    </TableHead>
                    <TableHead className="text-right">
                      Paid
                    </TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobInvoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-neon-cyan">
                        {inv.id}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(inv.amount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(
                          inv.amountPaid
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            inv.status === "paid"
                              ? "success"
                              : inv.status ===
                                  "partial"
                                ? "warning"
                                : "danger"
                          }
                        >
                          {inv.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="font-mono text-xs text-hud-dim">
                No invoices recorded
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
