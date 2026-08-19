/**
 * SteelCFO Risk Engine
 *
 * Multi-factor risk scoring and executive briefing generation.
 * Ported from extensions/steelcfo-forecast.ts risk_dashboard and cfo_brief
 * tools as pure functions with no external dependencies.
 *
 * Risk factors evaluated per job:
 * 1. Margin risk     — projected margin vs. original estimate (35% weight)
 * 2. AR risk         — overdue receivables for the job (25% weight)
 * 3. CO risk         — pending change order exposure (20% weight)
 * 4. Budget risk     — actual + committed vs. budget (20% weight)
 *
 * Scoring: 0-10 scale per factor, weighted average → overall score.
 * Risk levels: low (0-3.9), medium (4-5.9), high (6-7.9), critical (8-10).
 */

import type {
  Job,
  CostRecord,
  Invoice,
  ChangeOrder,
  PayrollRecord,
  BankAccount,
  Bill,
  RiskScore,
  CfoBrief,
} from "./types"
import { calculateJobCostSummary } from "./job-costing"
import {
  calculateArAging,
  calculateApSchedule,
} from "./forecasting"

// ---------------------------------------------------------------------------
// Risk Scores
// ---------------------------------------------------------------------------

/**
 * Calculate multi-factor risk scores for all active jobs.
 *
 * Returns jobs sorted by overall score descending (highest risk first).
 */
export function calculateRiskScores(
  jobs: Job[],
  costs: CostRecord[],
  invoices: Invoice[],
  changeOrders: ChangeOrder[],
  asOfDate?: string
): RiskScore[] {
  const activeJobs = jobs.filter(
    (j) => j.status === "active"
  )

  return activeJobs
    .map((job) => {
      const factors: string[] = []

      // ---------------------------------------------------------------
      // Factor 1: Margin Risk (weight 0.35)
      // ---------------------------------------------------------------
      const jobCosts = costs.filter(
        (c) => c.jobId === job.id
      )
      const costToDate = jobCosts.reduce(
        (s, c) => s + c.actualAmount,
        0
      )
      const approvedCOs = changeOrders.filter(
        (co) =>
          co.jobId === job.id &&
          co.status === "approved"
      )
      const revisedContract =
        job.contractValue +
        approvedCOs.reduce(
          (s, co) => s + co.amount,
          0
        )

      const pct =
        job.estimatedCost > 0
          ? Math.min(1, costToDate / job.estimatedCost)
          : job.percentComplete / 100

      const projectedCost =
        pct > 0.1
          ? costToDate / pct
          : job.estimatedCost
      const projectedMarginPct =
        revisedContract > 0
          ? ((revisedContract - projectedCost) /
              revisedContract) *
            100
          : 0
      const originalMarginPct =
        job.contractValue > 0
          ? ((job.contractValue - job.estimatedCost) /
              job.contractValue) *
            100
          : 0
      const marginErosion =
        originalMarginPct - projectedMarginPct

      let marginRisk = 0
      if (projectedMarginPct < 5) {
        marginRisk = 10
        factors.push("Projected margin below 5%")
      } else if (projectedMarginPct < 10) {
        marginRisk = 7
        factors.push("Projected margin below 10%")
      } else if (marginErosion > 5) {
        marginRisk = 6
        factors.push(
          `Margin erosion of ${marginErosion.toFixed(1)}%`
        )
      } else {
        marginRisk = 2
      }

      // ---------------------------------------------------------------
      // Factor 2: AR Risk (weight 0.25)
      // ---------------------------------------------------------------
      const jobInvoices = invoices.filter(
        (i) =>
          i.jobId === job.id && i.status !== "paid"
      )
      // Compare date strings — Date parsing mixes UTC midnight with the
      // local clock and flags next-day invoices as overdue in the evening
      const todayStr = asOfDate
        ? asOfDate
        : new Date().toISOString().split("T")[0]
      const overdueInvoices = jobInvoices.filter(
        (i) => i.dueDate < todayStr
      )

      let arRisk = 0
      if (overdueInvoices.length > 0) {
        const overdueAmt = overdueInvoices.reduce(
          (s, i) => s + (i.amount - i.amountPaid),
          0
        )
        if (overdueAmt > 100000) {
          arRisk = 9
          factors.push(
            `$${(overdueAmt / 1000).toFixed(0)}K overdue receivables`
          )
        } else if (overdueAmt > 50000) {
          arRisk = 6
          factors.push(
            `$${(overdueAmt / 1000).toFixed(0)}K overdue receivables`
          )
        } else {
          arRisk = 3
        }
      }

      // ---------------------------------------------------------------
      // Factor 3: Change Order Exposure (weight 0.20)
      // ---------------------------------------------------------------
      const pendingCOs = changeOrders.filter(
        (co) =>
          co.jobId === job.id &&
          co.status === "pending"
      )
      const pendingValue = pendingCOs.reduce(
        (s, co) => s + co.amount,
        0
      )

      let coRisk = 0
      if (
        revisedContract > 0 &&
        pendingValue > revisedContract * 0.1
      ) {
        coRisk = 8
        factors.push(
          `Pending COs = ${((pendingValue / revisedContract) * 100).toFixed(0)}% of contract`
        )
      } else if (pendingCOs.length > 3) {
        coRisk = 5
        factors.push(
          `${pendingCOs.length} pending change orders`
        )
      } else {
        coRisk = 2
      }

      // ---------------------------------------------------------------
      // Factor 4: Budget Risk (weight 0.20)
      // ---------------------------------------------------------------
      const committed = jobCosts.reduce(
        (s, c) => s + c.committedAmount,
        0
      )
      const totalExposure = costToDate + committed

      let budgetRisk = 0
      if (totalExposure > job.estimatedCost * 1.1) {
        budgetRisk = 9
        factors.push(
          "Cost+committed exceeds budget by >10%"
        )
      } else if (totalExposure > job.estimatedCost) {
        budgetRisk = 5
        factors.push(
          "Cost+committed exceeds original budget"
        )
      } else {
        budgetRisk = 2
      }

      // ---------------------------------------------------------------
      // Weighted overall score
      // ---------------------------------------------------------------
      const overallScore =
        Math.round(
          (marginRisk * 0.35 +
            arRisk * 0.25 +
            coRisk * 0.2 +
            budgetRisk * 0.2) *
            10
        ) / 10

      let riskLevel: string
      if (overallScore >= 8) riskLevel = "critical"
      else if (overallScore >= 6) riskLevel = "high"
      else if (overallScore >= 4) riskLevel = "medium"
      else riskLevel = "low"

      return {
        jobId: job.id,
        jobName: job.name,
        overallScore,
        riskLevel,
        marginRisk,
        arRisk,
        coRisk,
        budgetRisk,
        factors,
      }
    })
    .sort((a, b) => b.overallScore - a.overallScore)
}

// ---------------------------------------------------------------------------
// CFO Executive Brief
// ---------------------------------------------------------------------------

/**
 * Generate a comprehensive executive briefing consolidating cash position,
 * AR/AP status, job portfolio health, top risks, and action items.
 */
export function generateCfoBrief(
  jobs: Job[],
  costs: CostRecord[],
  invoices: Invoice[],
  bills: Bill[],
  changeOrders: ChangeOrder[],
  payroll: PayrollRecord[],
  bankAccounts: BankAccount[]
): CfoBrief {
  // --- Cash Position ---
  const cashAccounts = bankAccounts.filter(
    (a) =>
      a.accountType === "checking" ||
      a.accountType === "operating" ||
      a.accountType === "payroll" ||
      a.accountType === "savings"
  )
  const totalCash = cashAccounts.reduce(
    (s, a) => s + a.balance,
    0
  )
  const creditLines = bankAccounts.filter(
    (a) => a.accountType === "line_of_credit"
  )
  const availableCredit = creditLines.reduce(
    (s, a) => s + a.availableCredit,
    0
  )

  // --- Receivables ---
  const arData = calculateArAging(invoices)

  // --- Payables ---
  const apData = calculateApSchedule(bills)

  // --- Risk Scores ---
  const riskScores = calculateRiskScores(
    jobs,
    costs,
    invoices,
    changeOrders
  )

  // --- Job Portfolio ---
  const summaries = calculateJobCostSummary(
    jobs,
    costs,
    invoices,
    changeOrders
  )

  const activeJobs = jobs.filter(
    (j) => j.status === "active"
  )
  const totalContractValue = activeJobs.reduce(
    (s, j) => s + j.contractValue,
    0
  )
  const totalBacklog = summaries.reduce(
    (s, jcs) =>
      s +
      Math.max(
        0,
        jcs.revisedContract - jcs.earnedRevenue
      ),
    0
  )

  // Revenue-weighted average margin
  const totalRevisedContract = summaries.reduce(
    (s, jcs) => s + jcs.revisedContract,
    0
  )
  const weightedMargin =
    totalRevisedContract > 0
      ? summaries.reduce(
          (s, jcs) =>
            s +
            jcs.projectedMarginPct *
              jcs.revisedContract,
          0
        ) / totalRevisedContract
      : 0

  // --- Top Risks ---
  const topRisks = riskScores
    .filter((r) => r.overallScore >= 5)
    .flatMap((r) =>
      r.factors.map((f) => `${r.jobId}: ${f}`)
    )
    .slice(0, 5)

  if (topRisks.length === 0) {
    topRisks.push(
      "No critical risks identified this period"
    )
  }

  // --- Action Items ---
  const actionItems: string[] = []

  const overdueAR =
    arData.totals.days60 +
    arData.totals.days90 +
    arData.totals.days120Plus
  if (overdueAR > 0) {
    actionItems.push(
      "Follow up on overdue receivables >60 days"
    )
  }

  if (apData.totals.dueNext7 > totalCash * 0.5) {
    actionItems.push(
      "Large AP payments due this week — verify cash coverage"
    )
  }

  const highRiskJobs = riskScores.filter(
    (r) => r.overallScore >= 7
  )
  if (highRiskJobs.length > 0) {
    actionItems.push(
      `Review ${highRiskJobs.length} high-risk job(s) for corrective action`
    )
  }

  const pendingCOs = changeOrders.filter(
    (co) => co.status === "pending"
  )
  if (pendingCOs.length > 0) {
    const pendingTotal = pendingCOs.reduce(
      (s, co) => s + co.amount,
      0
    )
    actionItems.push(
      `Push for approval on ${pendingCOs.length} pending CO(s) totaling $${(pendingTotal / 1000).toFixed(0)}K`
    )
  }

  if (actionItems.length === 0) {
    actionItems.push(
      "Standard weekly review — no urgent actions needed"
    )
  }

  return {
    generatedAt: new Date().toISOString(),
    cashPosition: {
      totalCash:
        Math.round(totalCash * 100) / 100,
      availableCredit:
        Math.round(availableCredit * 100) / 100,
      totalLiquidity:
        Math.round(
          (totalCash + availableCredit) * 100
        ) / 100,
    },
    receivables: {
      totalOutstanding: arData.totals.total,
      overdue:
        Math.round(
          (arData.totals.days30 +
            arData.totals.days60 +
            arData.totals.days90 +
            arData.totals.days120Plus) *
            100
        ) / 100,
      overduePercent:
        arData.totals.total > 0
          ? Math.round(
              ((arData.totals.total -
                arData.totals.current) /
                arData.totals.total) *
                10000
            ) / 100
          : 0,
      dso: arData.dso,
    },
    payables: {
      totalOutstanding:
        apData.totals.outstanding,
      dueNext7Days: apData.totals.dueNext7,
      dueNext30Days: apData.totals.dueNext30,
    },
    portfolio: {
      activeJobs: activeJobs.length,
      totalContractValue:
        Math.round(totalContractValue * 100) /
        100,
      totalBacklog:
        Math.round(totalBacklog * 100) / 100,
      weightedMargin:
        Math.round(weightedMargin * 100) / 100,
      jobsAtRisk: riskScores.filter(
        (r) => r.overallScore >= 5
      ).length,
    },
    topRisks,
    actionItems,
  }
}
