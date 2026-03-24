/**
 * SteelCFO Engine Types
 *
 * Pure data interfaces used across all engine modules. These mirror the Prisma
 * models but use plain numbers (not Decimal) for computation convenience.
 */

// ---------------------------------------------------------------------------
// Data Models (plain objects from Prisma → engine boundary)
// ---------------------------------------------------------------------------

export interface Job {
  id: string
  name: string
  customer: string
  contractValue: number
  estimatedCost: number
  status: string
  type: string
  tons: number
  startDate: string
  endDate: string | null
  percentComplete: number
}

export interface CostRecord {
  jobId: string
  costCode: string
  description: string
  budgetAmount: number
  actualAmount: number
  committedAmount: number
  costType: string
  period?: string
}

export interface Invoice {
  id: string
  jobId: string
  customer: string
  amount: number
  amountPaid: number
  invoiceDate: string
  dueDate: string
  paidDate: string | null
  status: string
  retainage: number
}

export interface Bill {
  id: string
  jobId: string
  vendor: string
  amount: number
  dueDate: string
  paidDate: string | null
  status: string
  category: string
}

export interface ChangeOrder {
  id: string
  jobId: string
  description: string
  amount: number
  status: string
  submittedDate: string
  approvedDate: string | null
  probability: number
}

export interface PayrollRecord {
  jobId: string
  weekEnding: string
  employees: number
  straightHours: number
  overtimeHours: number
  totalHours: number
  grossPay: number
  tonsInstalled: number
  hoursPerTon: number
}

export interface BankAccount {
  name: string
  accountType: string
  balance: number
  availableCredit: number
  asOfDate: string
}

// ---------------------------------------------------------------------------
// Job Costing Results
// ---------------------------------------------------------------------------

export interface JobCostSummary {
  jobId: string
  jobName: string
  customer: string
  contractValue: number
  approvedChanges: number
  revisedContract: number
  estimatedCost: number
  costToDate: number
  committedCost: number
  projectedCost: number
  projectedMargin: number
  projectedMarginPct: number
  percentComplete: number
  earnedRevenue: number
  billedToDate: number
  overUnderBilling: number
}

export interface CostCodeDetail {
  costCode: string
  description: string
  budgetAmount: number
  actualToDate: number
  committedNotInvoiced: number
  projectedAtCompletion: number
  varianceToBudget: number
  variancePct: number
  percentUsed: number
}

export interface WipLine {
  jobId: string
  jobName: string
  customer: string
  contractValue: number
  approvedChanges: number
  revisedContract: number
  percentComplete: number
  earnedRevenue: number
  billedToDate: number
  overUnderBilling: number
  position: "overbilled" | "underbilled" | "balanced"
}

export interface BacklogLine {
  jobId: string
  jobName: string
  customer: string
  status: string
  contractValue: number
  approvedChanges: number
  revisedContract: number
  completedValue: number
  remainingValue: number
  burnRate: number
  estimatedMonthsRemaining: number
}

// ---------------------------------------------------------------------------
// Cash Forecasting Results
// ---------------------------------------------------------------------------

export interface CashForecastWeek {
  weekNumber: number
  weekStart: string
  weekEnd: string
  beginningBalance: number
  arCollections: number
  otherInflows: number
  totalInflows: number
  apPayments: number
  payroll: number
  otherOutflows: number
  totalOutflows: number
  netCashFlow: number
  endingBalance: number
}

export interface ArAgingBucket {
  customer: string
  current: number
  days30: number
  days60: number
  days90: number
  days120Plus: number
  total: number
}

// ---------------------------------------------------------------------------
// Risk & Executive Briefing Results
// ---------------------------------------------------------------------------

export interface RiskScore {
  jobId: string
  jobName: string
  overallScore: number
  riskLevel: string
  marginRisk: number
  arRisk: number
  coRisk: number
  budgetRisk: number
  factors: string[]
}

export interface CfoBrief {
  generatedAt: string
  cashPosition: {
    totalCash: number
    availableCredit: number
    totalLiquidity: number
  }
  receivables: {
    totalOutstanding: number
    overdue: number
    overduePercent: number
    dso: number
  }
  payables: {
    totalOutstanding: number
    dueNext7Days: number
    dueNext30Days: number
  }
  portfolio: {
    activeJobs: number
    totalContractValue: number
    totalBacklog: number
    weightedMargin: number
    jobsAtRisk: number
  }
  topRisks: string[]
  actionItems: string[]
}
