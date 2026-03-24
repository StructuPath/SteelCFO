import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatCurrencyPrecise(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value)
}

export function formatCompactCurrency(amount: number): string {
  if (Math.abs(amount) >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`
  }
  if (Math.abs(amount) >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`
  }
  return formatCurrency(amount)
}

export function classifyRisk(score: number): "low" | "medium" | "high" | "critical" {
  if (score >= 80) return "low"
  if (score >= 60) return "medium"
  if (score >= 40) return "high"
  return "critical"
}

export function riskColor(level: "low" | "medium" | "high" | "critical"): string {
  switch (level) {
    case "low":
      return "text-steel-success"
    case "medium":
      return "text-steel-warning"
    case "high":
      return "text-orange-500"
    case "critical":
      return "text-steel-danger"
  }
}

export function riskBgColor(level: "low" | "medium" | "high" | "critical"): string {
  switch (level) {
    case "low":
      return "bg-steel-success-muted text-steel-success"
    case "medium":
      return "bg-steel-warning-muted text-steel-warning"
    case "high":
      return "bg-orange-500/15 text-orange-500"
    case "critical":
      return "bg-steel-danger-muted text-steel-danger"
  }
}

export function billingPositionColor(
  position: "overbilled" | "underbilled" | "balanced"
): string {
  switch (position) {
    case "overbilled":
      return "text-steel-success"
    case "underbilled":
      return "text-steel-danger"
    case "balanced":
      return "text-steel-muted"
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
