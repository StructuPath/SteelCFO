/**
 * SteelCFO Forecasting Engine
 *
 * Cash forecasting, AR aging, and AP schedule analysis.
 * Ported from extensions/steelcfo-forecast.ts as pure functions
 * with no external dependencies beyond the shared types.
 *
 * Steel construction financial assumptions:
 * - Typical DSO: 45-60 days
 * - Retention: 10%
 * - Payroll: weekly (largest cash outflow)
 * - Materials: net 30 terms
 * - Subcontractors: net 30-45 terms
 */

import type {
  Invoice,
  Bill,
  PayrollRecord,
  BankAccount,
  CashForecastWeek,
  ArAgingBucket,
} from "./types"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0]
}

function addDays(dateStr: string, days: number): Date {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d
}

function daysBetween(a: string | Date, b: string | Date): number {
  const da =
    typeof a === "string" ? new Date(a).getTime() : a.getTime()
  const db =
    typeof b === "string" ? new Date(b).getTime() : b.getTime()
  if (isNaN(da) || isNaN(db)) return 0
  return Math.round((db - da) / (1000 * 60 * 60 * 24))
}

// ---------------------------------------------------------------------------
// Cash Forecast (13-week rolling)
// ---------------------------------------------------------------------------

/**
 * 13-week rolling cash projection based on AR collections, AP payments,
 * and payroll obligations.
 *
 * Inflow schedule: open invoices matched to their due dates.
 * Outflow schedule: open bills matched to due dates + avg weekly payroll.
 */
export function calculateCashForecast(
  bankAccounts: BankAccount[],
  invoices: Invoice[],
  bills: Bill[],
  payroll: PayrollRecord[],
  weeks: number = 13
): {
  weeks: CashForecastWeek[]
  summary: {
    beginningCash: number
    endingCash: number
    minBalance: number
    minBalanceWeek: number
  }
} {
  // Starting cash from checking/operating accounts
  const cashAccounts = bankAccounts.filter(
    (a) =>
      a.accountType === "checking" ||
      a.accountType === "operating" ||
      a.accountType === "payroll"
  )
  let currentBalance = cashAccounts.reduce(
    (s, a) => s + a.balance,
    0
  )
  const beginningCash = currentBalance

  // Determine the Monday of the current week
  const now = new Date()
  const weekStart = new Date(now)
  const dayOfWeek = weekStart.getDay()
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  weekStart.setDate(weekStart.getDate() + mondayOffset)

  // Open items for projection
  const openInvoices = invoices.filter(
    (i) => i.status !== "paid"
  )
  const openBills = bills.filter((b) => b.status !== "paid")

  // Average weekly payroll from recent 4 weeks of data
  const sortedPayroll = [...payroll].sort((a, b) =>
    b.weekEnding.localeCompare(a.weekEnding)
  )
  const recentPayroll = sortedPayroll.slice(0, 4)
  const avgWeeklyPayroll =
    recentPayroll.length > 0
      ? recentPayroll.reduce(
          (s, p) => s + p.grossPay,
          0
        ) / recentPayroll.length
      : 0

  let minBalance = currentBalance
  let minBalanceWeek = 0
  const forecastWeeks: CashForecastWeek[] = []

  for (let w = 0; w < weeks; w++) {
    const wStart = new Date(weekStart)
    wStart.setDate(wStart.getDate() + w * 7)
    const wEnd = new Date(wStart)
    wEnd.setDate(wEnd.getDate() + 6)

    const wStartStr = toDateStr(wStart)
    const wEndStr = toDateStr(wEnd)

    // AR collections: invoices whose due date falls in this week
    const arCollections = openInvoices
      .filter(
        (i) =>
          i.dueDate >= wStartStr && i.dueDate <= wEndStr
      )
      .reduce(
        (s, i) => s + (i.amount - i.amountPaid),
        0
      )

    // AP payments: bills whose due date falls in this week
    const apPayments = openBills
      .filter(
        (b) =>
          b.dueDate >= wStartStr && b.dueDate <= wEndStr
      )
      .reduce((s, b) => s + b.amount, 0)

    const payrollAmt =
      Math.round(avgWeeklyPayroll * 100) / 100
    const totalInflows =
      Math.round(arCollections * 100) / 100
    const totalOutflows =
      Math.round((apPayments + payrollAmt) * 100) / 100
    const netCashFlow =
      Math.round((totalInflows - totalOutflows) * 100) /
      100
    const endingBalance =
      Math.round((currentBalance + netCashFlow) * 100) /
      100

    forecastWeeks.push({
      weekNumber: w + 1,
      weekStart: wStartStr,
      weekEnd: wEndStr,
      beginningBalance:
        Math.round(currentBalance * 100) / 100,
      arCollections:
        Math.round(arCollections * 100) / 100,
      otherInflows: 0,
      totalInflows,
      apPayments: Math.round(apPayments * 100) / 100,
      payroll: payrollAmt,
      otherOutflows: 0,
      totalOutflows,
      netCashFlow,
      endingBalance,
    })

    currentBalance = endingBalance
    if (endingBalance < minBalance) {
      minBalance = endingBalance
      minBalanceWeek = w + 1
    }
  }

  return {
    weeks: forecastWeeks,
    summary: {
      beginningCash:
        Math.round(beginningCash * 100) / 100,
      endingCash:
        Math.round(currentBalance * 100) / 100,
      minBalance: Math.round(minBalance * 100) / 100,
      minBalanceWeek,
    },
  }
}

// ---------------------------------------------------------------------------
// AR Aging
// ---------------------------------------------------------------------------

/**
 * Accounts receivable aging analysis.
 *
 * Buckets outstanding invoices by customer into current / 30 / 60 / 90 /
 * 120+ day aging buckets based on due date (not invoice date). Computes
 * portfolio-level DSO using the revenue-weighted method.
 */
export function calculateArAging(
  invoices: Invoice[],
  asOfDate?: string
): {
  buckets: ArAgingBucket[]
  totals: {
    current: number
    days30: number
    days60: number
    days90: number
    days120Plus: number
    total: number
  }
  dso: number
} {
  const refDate = asOfDate ? new Date(asOfDate) : new Date()

  // Only consider invoices that aren't fully paid
  const openInvoices = invoices.filter(
    (i) => i.status !== "paid"
  )

  // Group by customer
  const customerMap = new Map<
    string,
    ArAgingBucket
  >()

  for (const inv of openInvoices) {
    const outstanding = inv.amount - inv.amountPaid
    if (outstanding <= 0) continue

    const dueDate = new Date(inv.dueDate)
    const daysOverdue = daysBetween(dueDate, refDate)

    if (!customerMap.has(inv.customer)) {
      customerMap.set(inv.customer, {
        customer: inv.customer,
        current: 0,
        days30: 0,
        days60: 0,
        days90: 0,
        days120Plus: 0,
        total: 0,
      })
    }
    const bucket = customerMap.get(inv.customer)!

    if (daysOverdue <= 0) {
      bucket.current += outstanding
    } else if (daysOverdue <= 30) {
      bucket.days30 += outstanding
    } else if (daysOverdue <= 60) {
      bucket.days60 += outstanding
    } else if (daysOverdue <= 90) {
      bucket.days90 += outstanding
    } else {
      bucket.days120Plus += outstanding
    }

    bucket.total += outstanding
  }

  // Round all values and sort by total descending
  const buckets = Array.from(customerMap.values())
    .map((b) => ({
      customer: b.customer,
      current: Math.round(b.current * 100) / 100,
      days30: Math.round(b.days30 * 100) / 100,
      days60: Math.round(b.days60 * 100) / 100,
      days90: Math.round(b.days90 * 100) / 100,
      days120Plus:
        Math.round(b.days120Plus * 100) / 100,
      total: Math.round(b.total * 100) / 100,
    }))
    .sort((a, b) => b.total - a.total)

  // Aggregate totals
  const totals = buckets.reduce(
    (t, b) => ({
      current: t.current + b.current,
      days30: t.days30 + b.days30,
      days60: t.days60 + b.days60,
      days90: t.days90 + b.days90,
      days120Plus: t.days120Plus + b.days120Plus,
      total: t.total + b.total,
    }),
    {
      current: 0,
      days30: 0,
      days60: 0,
      days90: 0,
      days120Plus: 0,
      total: 0,
    }
  )

  // DSO: total outstanding / average daily revenue
  // Approximate from a 90-day revenue window
  const totalRevenue = invoices.reduce(
    (s, i) => s + i.amount,
    0
  )
  const avgDailyRevenue = totalRevenue / 90
  const dso =
    avgDailyRevenue > 0
      ? Math.round(totals.total / avgDailyRevenue)
      : 0

  return { buckets, totals, dso }
}

// ---------------------------------------------------------------------------
// AP Schedule
// ---------------------------------------------------------------------------

/**
 * Accounts payable schedule grouped into weekly buckets.
 *
 * Identifies overdue payments, upcoming obligations in the next 7 and
 * 30 days, and breaks down payables by vendor within each week.
 */
export function calculateApSchedule(
  bills: Bill[],
  asOfDate?: string
): {
  weeks: {
    weekStart: string
    weekEnd: string
    total: number
    items: {
      vendor: string
      amount: number
      category: string
    }[]
  }[]
  totals: {
    outstanding: number
    overdue: number
    dueNext7: number
    dueNext30: number
  }
} {
  const refDate = asOfDate
    ? new Date(asOfDate)
    : new Date()
  const refStr = toDateStr(refDate)

  const openBills = bills.filter(
    (b) => b.status !== "paid"
  )

  // Aggregate totals
  const outstanding = openBills.reduce(
    (s, b) => s + b.amount,
    0
  )
  const overdue = openBills
    .filter((b) => new Date(b.dueDate) < refDate)
    .reduce((s, b) => s + b.amount, 0)

  const next7Date = addDays(refStr, 7)
  const next30Date = addDays(refStr, 30)

  const dueNext7 = openBills
    .filter((b) => {
      const d = new Date(b.dueDate)
      return d >= refDate && d <= next7Date
    })
    .reduce((s, b) => s + b.amount, 0)

  const dueNext30 = openBills
    .filter((b) => {
      const d = new Date(b.dueDate)
      return d >= refDate && d <= next30Date
    })
    .reduce((s, b) => s + b.amount, 0)

  // Group into 4 weekly buckets
  const weeks: {
    weekStart: string
    weekEnd: string
    total: number
    items: {
      vendor: string
      amount: number
      category: string
    }[]
  }[] = []

  for (let w = 0; w < 4; w++) {
    const wStart = addDays(refStr, w * 7)
    const wEnd = addDays(refStr, w * 7 + 6)
    const wStartStr = toDateStr(wStart)
    const wEndStr = toDateStr(wEnd)

    const items = openBills
      .filter(
        (b) =>
          b.dueDate >= wStartStr &&
          b.dueDate <= wEndStr
      )
      .map((b) => ({
        vendor: b.vendor,
        amount: b.amount,
        category: b.category,
      }))

    weeks.push({
      weekStart: wStartStr,
      weekEnd: wEndStr,
      total: items.reduce(
        (s, i) => s + i.amount,
        0
      ),
      items,
    })
  }

  return {
    weeks,
    totals: {
      outstanding:
        Math.round(outstanding * 100) / 100,
      overdue: Math.round(overdue * 100) / 100,
      dueNext7: Math.round(dueNext7 * 100) / 100,
      dueNext30: Math.round(dueNext30 * 100) / 100,
    },
  }
}
