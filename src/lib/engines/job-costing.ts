/**
 * SteelCFO Job Costing Engine
 *
 * Pure functions for job cost summaries, cost-code detail, WIP schedule,
 * and backlog analysis. Ported from extensions/steelcfo-calc.ts with
 * no external dependencies beyond the shared types.
 */

import type {
  Job,
  CostRecord,
  Invoice,
  ChangeOrder,
  JobCostSummary,
  CostCodeDetail,
  WipLine,
  BacklogLine,
} from "./types"

// ---------------------------------------------------------------------------
// Job Cost Summary
// ---------------------------------------------------------------------------

/**
 * Portfolio-level or single-job P&L summary.
 *
 * Calculates revised contract (including approved COs), cost-to-date,
 * projected cost at completion (using cost-based % complete), projected
 * margin, earned revenue, and over/under billing.
 */
export function calculateJobCostSummary(
  jobs: Job[],
  costs: CostRecord[],
  invoices: Invoice[],
  changeOrders: ChangeOrder[],
  jobId?: string
): JobCostSummary[] {
  const targetJobs = jobId
    ? jobs.filter((j) => j.id === jobId)
    : jobs.filter(
        (j) => j.status === "active" || j.status === "complete"
      )

  return targetJobs.map((job) => {
    const jobCosts = costs.filter((c) => c.jobId === job.id)
    const jobInvoices = invoices.filter((i) => i.jobId === job.id)
    const approvedCOs = changeOrders.filter(
      (co) => co.jobId === job.id && co.status === "approved"
    )

    const approvedChanges = approvedCOs.reduce(
      (s, co) => s + co.amount,
      0
    )
    const revisedContract = job.contractValue + approvedChanges

    const costToDate = jobCosts.reduce(
      (s, c) => s + c.actualAmount,
      0
    )
    const committedCost = jobCosts.reduce(
      (s, c) => s + c.committedAmount,
      0
    )

    // Percent complete: cost-based method (actual / budget)
    const pct =
      job.estimatedCost > 0
        ? Math.min(1, costToDate / job.estimatedCost)
        : job.percentComplete / 100

    // Projected cost at completion using cost-to-complete method
    // If ≥10% complete, extrapolate; otherwise fall back to estimate
    const projectedCost =
      pct > 0.1 ? costToDate / pct : job.estimatedCost

    const projectedMargin = revisedContract - projectedCost
    const projectedMarginPct =
      revisedContract > 0
        ? (projectedMargin / revisedContract) * 100
        : 0

    const percentComplete = Math.round(pct * 10000) / 100
    const earnedRevenue = revisedContract * pct
    const billedToDate = jobInvoices.reduce(
      (s, i) => s + i.amount,
      0
    )

    return {
      jobId: job.id,
      jobName: job.name,
      customer: job.customer,
      contractValue: job.contractValue,
      approvedChanges,
      revisedContract,
      estimatedCost: job.estimatedCost,
      costToDate,
      committedCost,
      projectedCost: Math.round(projectedCost * 100) / 100,
      projectedMargin: Math.round(projectedMargin * 100) / 100,
      projectedMarginPct:
        Math.round(projectedMarginPct * 100) / 100,
      percentComplete,
      earnedRevenue: Math.round(earnedRevenue * 100) / 100,
      billedToDate,
      overUnderBilling:
        Math.round((billedToDate - earnedRevenue) * 100) / 100,
    }
  })
}

// ---------------------------------------------------------------------------
// Job Cost Detail (cost-code level)
// ---------------------------------------------------------------------------

/**
 * Cost-code level breakdown for a single job.
 *
 * Groups cost records by cost code, calculates projected-at-completion
 * using actual + committed, and determines budget variance.
 */
export function calculateJobCostDetail(
  job: Job,
  costs: CostRecord[]
): {
  costCodes: CostCodeDetail[]
  totals: {
    budget: number
    actual: number
    committed: number
    projected: number
    variance: number
  }
} {
  const jobCosts = costs.filter((c) => c.jobId === job.id)

  // Group by cost code in case multiple records per code
  const codeMap = new Map<
    string,
    {
      description: string
      budget: number
      actual: number
      committed: number
    }
  >()

  for (const c of jobCosts) {
    const existing = codeMap.get(c.costCode) ?? {
      description: c.description,
      budget: 0,
      actual: 0,
      committed: 0,
    }
    existing.budget += c.budgetAmount
    existing.actual += c.actualAmount
    existing.committed += c.committedAmount
    codeMap.set(c.costCode, existing)
  }

  const costCodes: CostCodeDetail[] = Array.from(
    codeMap.entries()
  )
    .map(([code, data]) => {
      // Projected = actual spent + remaining committed
      const committedNotInvoiced = Math.max(
        0,
        data.committed - data.actual
      )
      const projectedAtCompletion = data.actual + committedNotInvoiced
      const variance = data.budget - projectedAtCompletion

      return {
        costCode: code,
        description: data.description,
        budgetAmount: data.budget,
        actualToDate: data.actual,
        committedNotInvoiced,
        projectedAtCompletion,
        varianceToBudget:
          Math.round(variance * 100) / 100,
        variancePct:
          data.budget > 0
            ? Math.round(
                (variance / data.budget) * 10000
              ) / 100
            : 0,
        percentUsed:
          data.budget > 0
            ? Math.round(
                (data.actual / data.budget) * 10000
              ) / 100
            : 0,
      }
    })
    .sort((a, b) => a.costCode.localeCompare(b.costCode))

  const totals = {
    budget: costCodes.reduce(
      (s, c) => s + c.budgetAmount,
      0
    ),
    actual: costCodes.reduce(
      (s, c) => s + c.actualToDate,
      0
    ),
    committed: costCodes.reduce(
      (s, c) => s + c.committedNotInvoiced,
      0
    ),
    projected: costCodes.reduce(
      (s, c) => s + c.projectedAtCompletion,
      0
    ),
    variance: costCodes.reduce(
      (s, c) => s + c.varianceToBudget,
      0
    ),
  }

  return { costCodes, totals }
}

// ---------------------------------------------------------------------------
// WIP Schedule (over/under billing)
// ---------------------------------------------------------------------------

/**
 * Work-in-progress schedule computing earned revenue vs. billed-to-date.
 *
 * Over/under billing thresholds:
 * - Overbilled:   billedToDate exceeds earnedRevenue by >$1,000
 * - Underbilled:  earnedRevenue exceeds billedToDate by >$1,000
 * - Balanced:     within $1,000 tolerance
 */
export function calculateWipSchedule(
  jobs: Job[],
  costs: CostRecord[],
  invoices: Invoice[],
  changeOrders: ChangeOrder[]
): {
  lines: WipLine[]
  totals: {
    earned: number
    billed: number
    net: number
    overbilled: number
    underbilled: number
  }
} {
  const activeJobs = jobs.filter(
    (j) => j.status === "active" || j.status === "complete"
  )

  const lines: WipLine[] = activeJobs.map((job) => {
    const approvedCOs = changeOrders.filter(
      (co) =>
        co.jobId === job.id && co.status === "approved"
    )
    const approvedChanges = approvedCOs.reduce(
      (s, co) => s + co.amount,
      0
    )
    const revisedContract =
      job.contractValue + approvedChanges

    // Cost-based percent complete
    const jobCosts = costs.filter(
      (c) => c.jobId === job.id
    )
    const costToDate = jobCosts.reduce(
      (s, c) => s + c.actualAmount,
      0
    )
    const pct =
      job.estimatedCost > 0
        ? Math.min(1, costToDate / job.estimatedCost)
        : job.percentComplete / 100

    const percentComplete =
      Math.round(pct * 10000) / 100
    const earnedRevenue =
      Math.round(revisedContract * pct * 100) / 100

    const billedToDate = invoices
      .filter((i) => i.jobId === job.id)
      .reduce((s, i) => s + i.amount, 0)

    const overUnderBilling =
      Math.round((billedToDate - earnedRevenue) * 100) / 100

    let position: "overbilled" | "underbilled" | "balanced"
    if (overUnderBilling > 1000) {
      position = "overbilled"
    } else if (overUnderBilling < -1000) {
      position = "underbilled"
    } else {
      position = "balanced"
    }

    return {
      jobId: job.id,
      jobName: job.name,
      customer: job.customer,
      contractValue: job.contractValue,
      approvedChanges,
      revisedContract,
      percentComplete,
      earnedRevenue,
      billedToDate,
      overUnderBilling,
      position,
    }
  })

  const totals = {
    earned: lines.reduce(
      (s, l) => s + l.earnedRevenue,
      0
    ),
    billed: lines.reduce(
      (s, l) => s + l.billedToDate,
      0
    ),
    net: lines.reduce(
      (s, l) => s + l.overUnderBilling,
      0
    ),
    overbilled: lines
      .filter((l) => l.position === "overbilled")
      .reduce((s, l) => s + l.overUnderBilling, 0),
    underbilled: lines
      .filter((l) => l.position === "underbilled")
      .reduce(
        (s, l) => s + Math.abs(l.overUnderBilling),
        0
      ),
  }

  return { lines, totals }
}

// ---------------------------------------------------------------------------
// Backlog Report
// ---------------------------------------------------------------------------

/**
 * Remaining work and pipeline analysis.
 *
 * Computes remaining contract value per job, monthly burn rate derived
 * from actual cost velocity, and estimated months of work remaining.
 */
export function calculateBacklog(
  jobs: Job[],
  costs: CostRecord[],
  changeOrders: ChangeOrder[]
): {
  lines: BacklogLine[]
  totalBacklog: number
  avgBurnRate: number
  monthsOfWork: number
} {
  const activeJobs = jobs.filter(
    (j) => j.status === "active" || j.status === "pending"
  )

  const lines: BacklogLine[] = activeJobs.map((job) => {
    const approvedCOs = changeOrders.filter(
      (co) =>
        co.jobId === job.id && co.status === "approved"
    )
    const approvedChanges = approvedCOs.reduce(
      (s, co) => s + co.amount,
      0
    )
    const revisedContract =
      job.contractValue + approvedChanges

    // Percent complete from cost-based method
    const jobCosts = costs.filter(
      (c) => c.jobId === job.id
    )
    const totalActual = jobCosts.reduce(
      (s, c) => s + c.actualAmount,
      0
    )
    const pct =
      job.estimatedCost > 0
        ? Math.min(1, totalActual / job.estimatedCost)
        : job.percentComplete / 100

    const completedValue = revisedContract * pct
    const remainingValue = revisedContract - completedValue

    // Estimate monthly burn rate from elapsed time
    const startDate = new Date(job.startDate)
    const now = new Date()
    const monthsElapsed = Math.max(
      1,
      (now.getTime() - startDate.getTime()) /
        (1000 * 60 * 60 * 24 * 30)
    )
    const burnRate = totalActual / monthsElapsed
    const estimatedMonthsRemaining =
      burnRate > 0 ? remainingValue / burnRate : 0

    return {
      jobId: job.id,
      jobName: job.name,
      customer: job.customer,
      status: job.status,
      contractValue: job.contractValue,
      approvedChanges,
      revisedContract,
      completedValue:
        Math.round(completedValue * 100) / 100,
      remainingValue:
        Math.round(remainingValue * 100) / 100,
      burnRate: Math.round(burnRate * 100) / 100,
      estimatedMonthsRemaining:
        Math.round(estimatedMonthsRemaining * 10) / 10,
    }
  })

  const totalBacklog = lines.reduce(
    (s, l) => s + l.remainingValue,
    0
  )
  const avgBurnRate = lines.reduce(
    (s, l) => s + l.burnRate,
    0
  )
  const monthsOfWork =
    avgBurnRate > 0 ? totalBacklog / avgBurnRate : 0

  return {
    lines,
    totalBacklog: Math.round(totalBacklog * 100) / 100,
    avgBurnRate: Math.round(avgBurnRate * 100) / 100,
    monthsOfWork: Math.round(monthsOfWork * 10) / 10,
  }
}
