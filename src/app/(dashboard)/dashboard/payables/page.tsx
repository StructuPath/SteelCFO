import { getAllData } from "@/lib/data"
import { calculateApSchedule } from "@/lib/engines/forecasting"
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
import { MetricCard } from "@/components/metric-card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function PayablesPage() {
  const data = await getAllData()
  const schedule = calculateApSchedule(data.bills)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="mb-1 flex items-center gap-3">
          <span className="text-xl text-neon-cyan">
            ◁
          </span>
          <h1 className="font-display text-xl font-bold uppercase tracking-[0.15em] text-neon-cyan text-glow-cyan">
            Outbound Matrix
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-px w-4 bg-neon-cyan/30" />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-hud-dim">
            Payment schedule and vendor management
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Total Outstanding"
          value={formatCurrency(
            schedule.totals.outstanding
          )}
          icon="◁"
        />
        <MetricCard
          title="Overdue"
          value={formatCurrency(
            schedule.totals.overdue
          )}
          icon="⚡"
          trend={
            schedule.totals.overdue > 0
              ? {
                  value: "Requires attention",
                  positive: false,
                }
              : undefined
          }
        />
        <MetricCard
          title="Due Next 7 Days"
          value={formatCurrency(
            schedule.totals.dueNext7
          )}
          icon="▤"
        />
        <MetricCard
          title="Due Next 30 Days"
          value={formatCurrency(
            schedule.totals.dueNext30
          )}
          icon="◈"
        />
      </div>

      {/* Weekly payment schedule cards */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <span className="h-px w-4 bg-neon-magenta/30" />
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-hud-dim">
            {"// Payment Schedule"}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {schedule.weeks.map((w, i) => (
            <Card key={i} className="hud-corners">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">
                  Week {i + 1}
                </CardTitle>
                <p className="font-mono text-[9px] tabular-nums text-hud-dim">
                  {w.weekStart} — {w.weekEnd}
                </p>
              </CardHeader>
              <CardContent>
                <p className="mb-3 font-display text-xl font-bold tabular-nums text-hud-text text-glow-cyan">
                  {formatCurrency(w.total)}
                </p>
                {w.items.length > 0 ? (
                  <div className="space-y-2">
                    {w.items.map((item, j) => (
                      <div
                        key={j}
                        className="flex justify-between font-mono text-[10px]"
                      >
                        <span className="max-w-[120px] truncate text-hud-muted">
                          {item.vendor}
                        </span>
                        <span className="tabular-nums text-hud-text">
                          {formatCurrency(
                            item.amount
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="font-mono text-[10px] text-hud-dim">
                    No payments due
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* All bills table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="text-neon-magenta">
              ▤
            </span>
            <CardTitle>All Bills</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill #</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">
                  Amount
                </TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.bills.map((bill) => {
                const isOverdue =
                  new Date(bill.dueDate) <
                    new Date() &&
                  bill.status !== "paid"
                return (
                  <TableRow key={bill.id}>
                    <TableCell className="font-mono text-xs text-neon-cyan">
                      {bill.id}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-hud-muted">
                      {bill.jobId}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-hud-text">
                      {bill.vendor}
                    </TableCell>
                    <TableCell className="font-mono text-[10px] uppercase text-hud-muted">
                      {bill.category}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs tabular-nums text-hud-text">
                      {formatCurrency(bill.amount)}
                    </TableCell>
                    <TableCell
                      className={`font-mono text-[10px] ${isOverdue ? "text-neon-red text-glow-red" : "text-hud-dim"}`}
                    >
                      {bill.dueDate}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          bill.status === "paid"
                            ? "success"
                            : bill.status ===
                                "scheduled"
                              ? "secondary"
                              : "warning"
                        }
                      >
                        {bill.status}
                      </Badge>
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
