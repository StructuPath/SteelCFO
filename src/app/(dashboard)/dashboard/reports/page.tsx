import { getAllData } from "@/lib/data"
import {
  calculateWipSchedule,
  calculateBacklog,
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { MetricCard } from "@/components/metric-card"
import { formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function ReportsPage() {
  const data = await getAllData()

  const wip = calculateWipSchedule(
    data.jobs,
    data.costs,
    data.invoices,
    data.changeOrders
  )
  const backlog = calculateBacklog(
    data.jobs,
    data.costs,
    data.changeOrders
  )

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="mb-1 flex items-center gap-3">
          <span className="text-xl text-neon-cyan">
            ▤
          </span>
          <h1 className="font-display text-xl font-bold uppercase tracking-[0.15em] text-neon-cyan text-glow-cyan">
            Analytics Hub
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-px w-4 bg-neon-cyan/30" />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-hud-dim">
            WIP schedule, backlog analysis, and
            financial reports
          </p>
        </div>
      </div>

      <Tabs defaultValue="wip">
        <TabsList>
          <TabsTrigger value="wip">
            WIP Schedule
          </TabsTrigger>
          <TabsTrigger value="backlog">
            Backlog Report
          </TabsTrigger>
        </TabsList>

        {/* ---- WIP Tab ---- */}
        <TabsContent value="wip">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard
                title="Total Earned"
                value={formatCurrency(
                  wip.totals.earned
                )}
                icon="◈"
              />
              <MetricCard
                title="Total Billed"
                value={formatCurrency(
                  wip.totals.billed
                )}
                icon="▤"
              />
              <MetricCard
                title="Net Over/Under"
                value={formatCurrency(
                  wip.totals.net
                )}
                icon={
                  wip.totals.net >= 0 ? "▲" : "▼"
                }
                trend={{
                  value:
                    wip.totals.net >= 0
                      ? "Net overbilled"
                      : "Net underbilled",
                  positive: wip.totals.net >= 0,
                }}
              />
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="text-neon-green">
                    ◇
                  </span>
                  <CardTitle>
                    Work-in-Progress Schedule
                  </CardTitle>
                </div>
                <CardDescription>
                  Over/under billing analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead className="text-right">
                        Revised Contract
                      </TableHead>
                      <TableHead className="text-right">
                        % Complete
                      </TableHead>
                      <TableHead className="text-right">
                        Earned Revenue
                      </TableHead>
                      <TableHead className="text-right">
                        Billed to Date
                      </TableHead>
                      <TableHead className="text-right">
                        Over/(Under)
                      </TableHead>
                      <TableHead>Position</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wip.lines.map((l) => (
                      <TableRow key={l.jobId}>
                        <TableCell className="font-mono text-xs font-semibold text-neon-cyan">
                          {l.jobId}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-hud-muted">
                          {l.customer}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums text-hud-text">
                          {formatCurrency(
                            l.revisedContract
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums text-hud-muted">
                          {l.percentComplete.toFixed(
                            0
                          )}
                          %
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums text-hud-text">
                          {formatCurrency(
                            l.earnedRevenue
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums text-hud-text">
                          {formatCurrency(
                            l.billedToDate
                          )}
                        </TableCell>
                        <TableCell
                          className={`text-right font-mono text-xs font-medium tabular-nums ${l.overUnderBilling >= 0 ? "text-neon-green" : "text-neon-red"}`}
                        >
                          {formatCurrency(
                            l.overUnderBilling
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              l.position ===
                              "overbilled"
                                ? "success"
                                : l.position ===
                                    "underbilled"
                                  ? "danger"
                                  : "outline"
                            }
                          >
                            {l.position}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="font-semibold"
                      >
                        TOTALS
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatCurrency(
                          wip.totals.earned
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatCurrency(
                          wip.totals.billed
                        )}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold tabular-nums ${wip.totals.net >= 0 ? "text-neon-green" : "text-neon-red"}`}
                      >
                        {formatCurrency(
                          wip.totals.net
                        )}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableFooter>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ---- Backlog Tab ---- */}
        <TabsContent value="backlog">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <MetricCard
                title="Total Backlog"
                value={formatCurrency(
                  backlog.totalBacklog
                )}
                icon="▤"
              />
              <MetricCard
                title="Monthly Burn Rate"
                value={formatCurrency(
                  backlog.avgBurnRate
                )}
                subtitle="Avg across all jobs"
                icon="⚡"
              />
              <MetricCard
                title="Months of Work"
                value={backlog.monthsOfWork.toFixed(
                  1
                )}
                subtitle="At current burn rate"
                icon="◇"
              />
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <span className="text-neon-orange">
                    ◈
                  </span>
                  <CardTitle>
                    Backlog Report
                  </CardTitle>
                </div>
                <CardDescription>
                  Remaining work and estimated duration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">
                        Revised Contract
                      </TableHead>
                      <TableHead className="text-right">
                        Completed
                      </TableHead>
                      <TableHead className="text-right">
                        Remaining
                      </TableHead>
                      <TableHead className="text-right">
                        Monthly Burn
                      </TableHead>
                      <TableHead className="text-right">
                        Est. Months
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {backlog.lines.map((l) => (
                      <TableRow key={l.jobId}>
                        <TableCell className="font-mono text-xs font-semibold text-neon-cyan">
                          {l.jobId}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-hud-muted">
                          {l.customer}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              l.status === "active"
                                ? "success"
                                : "warning"
                            }
                          >
                            {l.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums text-hud-text">
                          {formatCurrency(
                            l.revisedContract
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums text-hud-muted">
                          {formatCurrency(
                            l.completedValue
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs font-medium tabular-nums text-neon-cyan">
                          {formatCurrency(
                            l.remainingValue
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums text-hud-muted">
                          {formatCurrency(
                            l.burnRate
                          )}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs tabular-nums text-hud-text">
                          {l.estimatedMonthsRemaining.toFixed(
                            1
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
