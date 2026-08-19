import { describe, it, expect } from "vitest"
import {
  calculateJobCostSummary,
  calculateJobCostDetail,
  calculateWipSchedule,
} from "./job-costing"
import type {
  Job,
  CostRecord,
  Invoice,
  ChangeOrder,
} from "./types"

const job: Job = {
  id: "J100",
  name: "Warehouse Frame",
  customer: "Acme GC",
  contractValue: 1_000_000,
  estimatedCost: 800_000,
  status: "active",
  type: "fabrication",
  tons: 120,
  startDate: "2026-01-01",
  endDate: null,
  percentComplete: 50,
}

const costs: CostRecord[] = [
  {
    jobId: "J100",
    costCode: "01-MAT",
    description: "Materials",
    budgetAmount: 400_000,
    actualAmount: 250_000,
    committedAmount: 300_000,
    costType: "material",
  },
  {
    jobId: "J100",
    costCode: "02-LAB",
    description: "Shop Labor",
    budgetAmount: 400_000,
    actualAmount: 150_000,
    committedAmount: 0,
    costType: "labor",
  },
]

const invoices: Invoice[] = [
  {
    id: "INV-1",
    jobId: "J100",
    customer: "Acme GC",
    amount: 300_000,
    amountPaid: 300_000,
    invoiceDate: "2026-02-01",
    dueDate: "2026-03-01",
    paidDate: "2026-03-01",
    status: "paid",
    retainage: 30_000,
  },
  {
    id: "INV-2",
    jobId: "J100",
    customer: "Acme GC",
    amount: 200_000,
    amountPaid: 0,
    invoiceDate: "2026-04-01",
    dueDate: "2026-05-01",
    paidDate: null,
    status: "open",
    retainage: 20_000,
  },
]

const changeOrders: ChangeOrder[] = [
  {
    id: "CO-1",
    jobId: "J100",
    description: "Added mezzanine",
    amount: 100_000,
    status: "approved",
    submittedDate: "2026-02-15",
    approvedDate: "2026-03-01",
    probability: 100,
  },
  {
    id: "CO-2",
    jobId: "J100",
    description: "Pending scope",
    amount: 50_000,
    status: "pending",
    submittedDate: "2026-04-01",
    approvedDate: null,
    probability: 60,
  },
]

describe("calculateJobCostSummary", () => {
  const [s] = calculateJobCostSummary([job], costs, invoices, changeOrders)

  it("includes only approved change orders in revised contract", () => {
    expect(s.approvedChanges).toBe(100_000)
    expect(s.revisedContract).toBe(1_100_000)
  })

  it("computes cost-based percent complete", () => {
    // 400k actual / 800k budget = 50%
    expect(s.costToDate).toBe(400_000)
    expect(s.percentComplete).toBe(50)
  })

  it("extrapolates projected cost from cost velocity", () => {
    // 400k / 0.5 = 800k projected at completion
    expect(s.projectedCost).toBe(800_000)
    expect(s.projectedMargin).toBe(300_000)
    expect(s.projectedMarginPct).toBeCloseTo(27.27, 1)
  })

  it("computes over/under billing against earned revenue", () => {
    // earned = 1.1M * 0.5 = 550k; billed = 500k => underbilled 50k
    expect(s.earnedRevenue).toBe(550_000)
    expect(s.billedToDate).toBe(500_000)
    expect(s.overUnderBilling).toBe(-50_000)
  })

  it("clamps percent complete at 100% on cost overruns", () => {
    const overrun: CostRecord[] = [
      { ...costs[0], actualAmount: 900_000, committedAmount: 0 },
    ]
    const [o] = calculateJobCostSummary([job], overrun, [], [])
    expect(o.percentComplete).toBe(100)
    // projected cost = cost to date when fully complete
    expect(o.projectedCost).toBe(900_000)
  })

  it("filters to a single job when jobId is passed", () => {
    const other: Job = { ...job, id: "J200", status: "pending" }
    const result = calculateJobCostSummary(
      [job, other],
      costs,
      invoices,
      changeOrders,
      "J100"
    )
    expect(result).toHaveLength(1)
    expect(result[0].jobId).toBe("J100")
  })
})

describe("calculateJobCostDetail", () => {
  it("groups by cost code and computes committed-not-invoiced", () => {
    const { costCodes, totals } = calculateJobCostDetail(job, costs)
    expect(costCodes).toHaveLength(2)
    const mat = costCodes.find((c) => c.costCode === "01-MAT")!
    // committed 300k - actual 250k = 50k not yet invoiced
    expect(mat.committedNotInvoiced).toBe(50_000)
    expect(mat.projectedAtCompletion).toBe(300_000)
    expect(mat.varianceToBudget).toBe(100_000)
    expect(totals.budget).toBe(800_000)
    expect(totals.actual).toBe(400_000)
  })

  it("never reports negative committed-not-invoiced", () => {
    const overInvoiced: CostRecord[] = [
      { ...costs[0], actualAmount: 350_000, committedAmount: 300_000 },
    ]
    const { costCodes } = calculateJobCostDetail(job, overInvoiced)
    expect(costCodes[0].committedNotInvoiced).toBe(0)
  })
})

describe("calculateWipSchedule", () => {
  it("classifies billing position with $1,000 tolerance", () => {
    const { lines } = calculateWipSchedule(
      [job],
      costs,
      invoices,
      changeOrders
    )
    // underbilled by 50k
    expect(lines[0].position).toBe("underbilled")

    const balancedInvoices: Invoice[] = [
      { ...invoices[0], amount: 550_000, amountPaid: 550_000 },
    ]
    const balanced = calculateWipSchedule(
      [job],
      costs,
      balancedInvoices,
      changeOrders
    )
    expect(balanced.lines[0].position).toBe("balanced")
  })

  it("totals overbilled and underbilled separately", () => {
    const { totals } = calculateWipSchedule(
      [job],
      costs,
      invoices,
      changeOrders
    )
    expect(totals.underbilled).toBe(50_000)
    expect(totals.overbilled).toBe(0)
    expect(totals.net).toBe(-50_000)
  })
})
