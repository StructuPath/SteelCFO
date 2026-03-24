import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: string
  subtitle?: string
  trend?: { value: string; positive: boolean }
  icon: string
  className?: string
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("group hud-corners", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-hud-muted">
              {title}
            </p>
            <p className="font-display text-2xl font-bold tracking-wide text-hud-text text-glow-cyan">
              {value}
            </p>
            {subtitle && (
              <p className="font-mono text-[10px] text-hud-dim">
                {subtitle}
              </p>
            )}
            {trend && (
              <div className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "font-mono text-[10px] font-semibold",
                    trend.positive
                      ? "text-neon-green text-glow-green"
                      : "text-neon-red text-glow-red"
                  )}
                >
                  {trend.positive ? "▲" : "▼"}{" "}
                  {trend.value}
                </span>
              </div>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-sm border border-grid-line bg-cyber-surface/50 text-xl opacity-60 transition-opacity group-hover:opacity-100">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
