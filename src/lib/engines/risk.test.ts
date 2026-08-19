import { describe, it, expect } from "vitest"
import { calculateRiskScores, generateCfoBrief } from "./risk"
import type {
  Job,
  CostRecord,
  Invoice,
  ChangeOrder,
} from "./types"

const AS_OF = "2026-08-19"

function job(overrides: Partial<Job>): Job {
  return {
    id: "J100",
    name: "Test Job",
    customer: "Acme GC",
    contractValue: 1_000_000,
    estimatedCost: 800_000,
    status: "active",
    type: "fabrication",
    tons: 100,
    startDate: "2026-01-01",
    endDate: null,
    percentComplete: 50,
    ...overrides,
  }
}

function cost(overrides: Partial<CostRecord>): CostRecord {
  return {
    jobId: "J100",
    costCode: "01",
    description: "Costs",
    budgetAmount: 800_000,
    actualAmount: 400_000,
    committedAmount: 0,
    costType: "material",
    ...overrides,
  }
}

describe("calculateRiskScores", () => {
  it("scores a healthy job as low risk", () => {
    const [r] = calculateRiskScores(
      [job({})],
      [cost({})],
      [],
      [],
      AS_OF
    )
    // margin 2, ar 0, co 2, budget 2 => 0.7+0+0.4+0.4 = 1.5
    expect(r.overallScore).toBe(1.5)
    expect(r.riskLevel).toBe("low")
    expect(r.factors).toHaveLength(0)
  })

  it("flags thin projected margins as maximum margin risk", () => {
    // 960k spent against an 800k budget => projected 960k cost on 1M contract (4% margin)
    const [r] = calculateRiskScores(
      [job({})],
      [cost({ actualAmount: 960_000, budgetAmount: 800_000 })],
      [],
      [],
      AS_OF
    )
    expect(r.marginRisk).toBe(10)
    expect(r.factors).toContain("Projected margin below 5%")
  })

  it("escalates AR risk with overdue amount", () => {
    const overdue: Invoice = {
      id: "INV-1",
      jobId: "J100",
      customer: "Acme GC",
      amount: 150_000,
      amountPaid: 0,
      invoiceDate: "2026-05-01",
      dueDate: "2026-06-01",
      paidDate: null,
      status: "open",
      retainage: 0,
    }
    const [r] = calculateRiskScores(
      [job({})],
      [cost({})],
      [overdue],
      [],
      AS_OF
    )
    expect(r.arRisk).toBe(9)
    expect(r.factors.some((f) => f.includes("overdue receivables"))).toBe(
      true
    )
  })

  it("flags heavy pending change order exposure", () => {
    const pendingCO: ChangeOrder = {
      id: "CO-1",
      jobId: "J100",
      description: "Big pending scope",
      amount: 200_000, // 20% of contract
      status: "pending",
      submittedDate: "2026-07-01",
      approvedDate: null,
      probability: 50,
    }
    const [r] = calculateRiskScores(
      [job({})],
      [cost({})],
      [],
      [pendingCO],
      AS_OF
    )
    expect(r.coRisk).toBe(8)
  })

  it("flags budget overrun from actual + committed", () => {
    const [r] = calculateRiskScores(
      [job({})],
      [cost({ actualAmount: 500_000, committedAmount: 400_000 })],
      [],
      [],
      AS_OF
    )
    expect(r.budgetRisk).toBe(9)
  })

  it("sorts jobs by risk descending and only scores active jobs", () => {
    const risky = job({ id: "J200", name: "Risky" })
    const done = job({ id: "J300", status: "complete" })
    const scores = calculateRiskScores(
      [job({}), risky, done],
      [
        cost({}),
        cost({ jobId: "J200", actualAmount: 960_000 }),
      ],
      [],
      [],
      AS_OF
    )
    expect(scores).toHaveLength(2)
    expect(scores[0].jobId).toBe("J200")
    expect(scores[0].overallScore).toBeGreaterThan(scores[1].overallScore)
  })
})

describe("generateCfoBrief", () => {
  it("aggregates cash, liquidity, and portfolio metrics", () => {
    const brief = generateCfoBrief(
      [job({})],
      [cost({})],
      [],
      [],
      [],
      [],
      [
        {
          name: "Operating",
          accountType: "checking",
          balance: 300_000,
          availableCredit: 0,
          asOfDate: AS_OF,
        },
        {
          name: "LOC",
          accountType: "line_of_credit",
          balance: 0,
          availableCredit: 200_000,
          asOfDate: AS_OF,
        },
      ]
    )
    expect(brief.cashPosition.totalCash).toBe(300_000)
    expect(brief.cashPosition.totalLiquidity).toBe(500_000)
    expect(brief.portfolio.activeJobs).toBe(1)
    expect(brief.topRisks.length).toBeGreaterThan(0)
    expect(brief.actionItems.length).toBeGreaterThan(0)
  })
})
