import { getAllData } from "@/lib/data"
import { calculateArAging } from "@/lib/engines/forecasting"
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
import { MetricCard } from "@/components/metric-card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function ReceivablesPage() {
  const data = await getAllData()
  const aging = calculateArAging(data.invoices)

  const overdue =
    aging.totals.days30 +
    aging.totals.days60 +
    aging.totals.days90 +
    aging.totals.days120Plus
  const overduePct =
    aging.totals.total > 0
      ? (
          ((aging.totals.total -
            aging.totals.current) /
            aging.totals.total) *
          100
        ).toFixed(0)
      : "0"

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="mb-1 flex items-center gap-3">
          <span className="text-xl text-neon-cyan">
            ▷
          </span>
          <h1 className="font-display text-xl font-bold uppercase tracking-[0.15em] text-neon-cyan text-glow-cyan">
            Inbound Matrix
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-px w-4 bg-neon-cyan/30" />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-hud-dim">
            AR aging analysis and collection tracking
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Total Outstanding"
          value={formatCurrency(aging.totals.total)}
          icon="▷"
        />
        <MetricCard
          title="Current"
          value={formatCurrency(aging.totals.current)}
          icon="◈"
        />
        <MetricCard
          title="Overdue (30+ days)"
          value={formatCurrency(overdue)}
          icon="⚡"
          trend={{
            value: `${overduePct}% of total`,
            positive: false,
          }}
        />
        <MetricCard
          title="DSO"
          value={`${aging.dso} days`}
          subtitle="Days Sales Outstanding"
          icon="◇"
        />
      </div>

      {/* Aging by customer */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="text-neon-orange">▣</span>
            <CardTitle>
              AR Aging by Customer
            </CardTitle>
          </div>
          <CardDescription>
            Outstanding receivables in aging buckets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">
                  Current
                </TableHead>
                <TableHead className="text-right">
                  1-30 Days
                </TableHead>
                <TableHead className="text-right">
                  31-60 Days
                </TableHead>
                <TableHead className="text-right">
                  61-90 Days
                </TableHead>
                <TableHead className="text-right">
                  90+ Days
                </TableHead>
                <TableHead className="text-right">
                  Total
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {aging.buckets.map((b) => (
                <TableRow key={b.customer}>
                  <TableCell className="font-mono text-xs font-medium text-hud-text">
                    {b.customer}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums text-neon-green">
                    {b.current > 0
                      ? formatCurrency(b.current)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums text-neon-orange">
                    {b.days30 > 0
                      ? formatCurrency(b.days30)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums text-neon-orange">
                    {b.days60 > 0
                      ? formatCurrency(b.days60)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums text-neon-red">
                    {b.days90 > 0
                      ? formatCurrency(b.days90)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums text-neon-red text-glow-red">
                    {b.days120Plus > 0
                      ? formatCurrency(
                          b.days120Plus
                        )
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-bold tabular-nums text-hud-text">
                    {formatCurrency(b.total)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-semibold">
                  TOTALS
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatCurrency(
                    aging.totals.current
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatCurrency(
                    aging.totals.days30
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatCurrency(
                    aging.totals.days60
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatCurrency(
                    aging.totals.days90
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatCurrency(
                    aging.totals.days120Plus
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold tabular-nums">
                  {formatCurrency(
                    aging.totals.total
                  )}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* All invoices */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="text-neon-cyan">▤</span>
            <CardTitle>All Invoices</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">
                  Amount
                </TableHead>
                <TableHead className="text-right">
                  Paid
                </TableHead>
                <TableHead className="text-right">
                  Outstanding
                </TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-xs text-neon-cyan">
                    {inv.id}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-hud-muted">
                    {inv.jobId}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-hud-text">
                    {inv.customer}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums text-hud-text">
                    {formatCurrency(inv.amount)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums text-neon-green">
                    {formatCurrency(inv.amountPaid)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-medium tabular-nums text-hud-text">
                    {formatCurrency(
                      inv.amount - inv.amountPaid
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-hud-dim">
                    {inv.dueDate}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        inv.status === "paid"
                          ? "success"
                          : inv.status === "partial"
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
        </CardContent>
      </Card>
    </div>
  )
}
