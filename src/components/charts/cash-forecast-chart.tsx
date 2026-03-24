"use client"

import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import type { CashForecastWeek } from "@/lib/engines/types"

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000)
    return `$${(value / 1_000_000).toFixed(1)}M`
  if (Math.abs(value) >= 1_000)
    return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

export function CashForecastChart({
  weeks,
}: {
  weeks: CashForecastWeek[]
}) {
  const data = weeks.map((w) => ({
    week: `W${w.weekNumber}`,
    balance: Math.round(w.endingBalance),
    inflows: Math.round(w.totalInflows),
    outflows: Math.round(w.totalOutflows),
  }))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="text-neon-cyan">◇</span>
          <CardTitle>
            Cash Flow Projection // 13-Week
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <ComposedChart data={data}>
              <defs>
                <linearGradient
                  id="balanceGlow"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#00FFFF"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor="#00FFFF"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(0,255,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="week"
                tick={{
                  fill: "#4A9BA8",
                  fontSize: 10,
                  fontFamily: "JetBrains Mono",
                }}
                axisLine={{
                  stroke: "rgba(0,255,255,0.1)",
                }}
                tickLine={{
                  stroke: "rgba(0,255,255,0.1)",
                }}
              />
              <YAxis
                tick={{
                  fill: "#4A9BA8",
                  fontSize: 10,
                  fontFamily: "JetBrains Mono",
                }}
                tickFormatter={formatCurrency}
                axisLine={{
                  stroke: "rgba(0,255,255,0.1)",
                }}
                tickLine={{
                  stroke: "rgba(0,255,255,0.1)",
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor:
                    "rgba(3,3,3,0.95)",
                  border:
                    "1px solid rgba(0,255,255,0.3)",
                  borderRadius: "2px",
                  color: "#E0F7FA",
                  fontFamily: "JetBrains Mono",
                  fontSize: "11px",
                  boxShadow:
                    "0 0 20px rgba(0,255,255,0.1)",
                }}
                formatter={(value: number) => [
                  formatCurrency(value),
                  "",
                ]}
                labelStyle={{
                  color: "#4A9BA8",
                  fontFamily: "JetBrains Mono",
                  fontSize: "10px",
                  textTransform: "uppercase" as const,
                  letterSpacing: "0.1em",
                }}
              />
              <ReferenceLine
                y={0}
                stroke="#FF0040"
                strokeDasharray="6 3"
                strokeWidth={1}
              />
              <Area
                type="monotone"
                dataKey="balance"
                fill="url(#balanceGlow)"
                stroke="none"
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#00FFFF"
                strokeWidth={2}
                dot={{
                  fill: "#00FFFF",
                  r: 3,
                  strokeWidth: 0,
                }}
                name="Balance"
              />
              <Line
                type="monotone"
                dataKey="inflows"
                stroke="#00FF41"
                strokeWidth={1}
                strokeDasharray="4 4"
                dot={false}
                name="Inflows"
              />
              <Line
                type="monotone"
                dataKey="outflows"
                stroke="#FF00FF"
                strokeWidth={1}
                strokeDasharray="4 4"
                dot={false}
                name="Outflows"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <span className="h-0.5 w-6 bg-neon-cyan" />
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-hud-muted">
              Balance
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-0.5 w-6"
              style={{
                borderTop: "1px dashed #00FF41",
                background: "none",
              }}
            />
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-hud-muted">
              Inflows
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-0.5 w-6"
              style={{
                borderTop: "1px dashed #FF00FF",
                background: "none",
              }}
            />
            <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-hud-muted">
              Outflows
            </span>
          </div>
          </div>
      </CardContent>
    </Card>
  )
}
