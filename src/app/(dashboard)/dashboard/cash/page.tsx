import { getAllData } from "@/lib/data"
import { calculateCashForecast } from "@/lib/engines/forecasting"
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
} from "@/components/ui/table"
import { MetricCard } from "@/components/metric-card"
import { CashForecastChart } from "@/components/charts/cash-forecast-chart"
import { formatCurrency } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function CashPage() {
  const data = await getAllData()
  const forecast = calculateCashForecast(
    data.bankAccounts,
    data.invoices,
    data.bills,
    data.payroll
  )

  const totalInflows = forecast.weeks.reduce(
    (s, w) => s + w.totalInflows,
    0
  )
  const totalOutflows = forecast.weeks.reduce(
    (s, w) => s + w.totalOutflows,
    0
  )
  const netFlow = totalInflows - totalOutflows

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="mb-1 flex items-center gap-3">
          <span className="text-xl text-neon-cyan">
            ◇
          </span>
          <h1 className="font-display text-xl font-bold uppercase tracking-[0.15em] text-neon-cyan text-glow-cyan">
            Treasury Matrix
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-px w-4 bg-neon-cyan/30" />
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-hud-dim">
            13-week rolling cash projection
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Beginning Cash"
          value={formatCurrency(
            forecast.summary.beginningCash
          )}
          icon="◇"
        />
        <MetricCard
          title="Projected Ending"
          value={formatCurrency(
            forecast.summary.endingCash
          )}
          icon="▲"
          trend={{
            value: formatCurrency(
              forecast.summary.endingCash -
                forecast.summary.beginningCash
            ),
            positive:
              forecast.summary.endingCash >=
              forecast.summary.beginningCash,
          }}
        />
        <MetricCard
          title="Minimum Balance"
          value={formatCurrency(
            forecast.summary.minBalance
          )}
          subtitle={`Week ${forecast.summary.minBalanceWeek}`}
          icon={
            forecast.summary.minBalance < 0
              ? "⚠"
              : "◈"
          }
        />
        <MetricCard
          title="Net Cash Flow"
          value={formatCurrency(netFlow)}
          subtitle={`${formatCurrency(totalInflows)} in / ${formatCurrency(totalOutflows)} out`}
          icon="⬡"
          trend={{
            value: `${((netFlow / Math.max(1, totalInflows)) * 100).toFixed(0)}%`,
            positive: netFlow >= 0,
          }}
        />
      </div>

      {/* Cash forecast chart */}
      <CashForecastChart weeks={forecast.weeks} />

      {/* Weekly detail table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="text-neon-cyan">▤</span>
            <CardTitle>Weekly Detail</CardTitle>
          </div>
          <CardDescription>
            13-week cash flow projections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Week</TableHead>
                <TableHead className="text-right">
                  Beginning
                </TableHead>
                <TableHead className="text-right">
                  AR Collections
                </TableHead>
                <TableHead className="text-right">
                  AP Payments
                </TableHead>
                <TableHead className="text-right">
                  Payroll
                </TableHead>
                <TableHead className="text-right">
                  Net Flow
                </TableHead>
                <TableHead className="text-right">
                  Ending Balance
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forecast.weeks.map((w) => (
                <TableRow key={w.weekNumber}>
                  <TableCell>
                    <div>
                      <p className="font-mono text-xs font-medium tabular-nums text-hud-text">
                        W{w.weekNumber}
                      </p>
                      <p className="font-mono text-[9px] text-hud-dim">
                        {w.weekStart}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums text-hud-muted">
                    {formatCurrency(
                      w.beginningBalance
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums text-neon-green">
                    {formatCurrency(
                      w.arCollections
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums text-neon-magenta">
                    {formatCurrency(w.apPayments)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums text-neon-magenta">
                    {formatCurrency(w.payroll)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono text-xs font-medium tabular-nums ${w.netCashFlow >= 0 ? "text-neon-green" : "text-neon-red"}`}
                  >
                    {formatCurrency(w.netCashFlow)}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono text-xs font-bold tabular-nums ${w.endingBalance < 0 ? "text-neon-red text-glow-red" : "text-hud-text"}`}
                  >
                    {formatCurrency(
                      w.endingBalance
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Bank accounts table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <span className="text-neon-green">◈</span>
            <CardTitle>Bank Accounts</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">
                  Balance
                </TableHead>
                <TableHead className="text-right">
                  Available Credit
                </TableHead>
                <TableHead>As Of</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.bankAccounts.map((a, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs font-medium text-neon-cyan">
                    {a.name}
                  </TableCell>
                  <TableCell className="font-mono text-[10px] uppercase text-hud-muted">
                    {a.accountType.replace(/_/g, " ")}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums text-hud-text">
                    {formatCurrency(a.balance)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums text-hud-muted">
                    {a.availableCredit > 0
                      ? formatCurrency(
                          a.availableCredit
                        )
                      : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-[10px] text-hud-dim">
                    {a.asOfDate}
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
