import { describe, it, expect } from "vitest"
import {
  calculateCashForecast,
  calculateArAging,
  calculateApSchedule,
} from "./forecasting"
import type {
  Invoice,
  Bill,
  PayrollRecord,
  BankAccount,
} from "./types"

// 2026-08-19 is a Wednesday; the forecast week 1 runs Mon 08-17 .. Sun 08-23
const AS_OF = "2026-08-19"

function invoice(overrides: Partial<Invoice>): Invoice {
  return {
    id: "INV-X",
    jobId: "J100",
    customer: "Acme GC",
    amount: 100_000,
    amountPaid: 0,
    invoiceDate: "2026-07-01",
    dueDate: "2026-08-20",
    paidDate: null,
    status: "open",
    retainage: 0,
    ...overrides,
  }
}

function bill(overrides: Partial<Bill>): Bill {
  return {
    id: "BILL-X",
    jobId: "J100",
    vendor: "Steel Supply Co",
    amount: 40_000,
    dueDate: "2026-08-20",
    paidDate: null,
    status: "open",
    category: "material",
    ...overrides,
  }
}

const bankAccounts: BankAccount[] = [
  {
    name: "Operating",
    accountType: "checking",
    balance: 500_000,
    availableCredit: 0,
    asOfDate: AS_OF,
  },
  {
    name: "LOC",
    accountType: "line_of_credit",
    balance: 0,
    availableCredit: 250_000,
    asOfDate: AS_OF,
  },
]

const payroll: PayrollRecord[] = [1, 2, 3, 4].map((n) => ({
  jobId: "J100",
  weekEnding: `2026-08-0${n}`,
  employees: 10,
  straightHours: 400,
  overtimeHours: 20,
  totalHours: 420,
  grossPay: 30_000,
  tonsInstalled: 15,
  hoursPerTon: 28,
}))

describe("calculateCashForecast", () => {
  it("starts from cash accounts only (not credit lines)", () => {
    const { summary } = calculateCashForecast(
      bankAccounts,
      [],
      [],
      [],
      13,
      AS_OF
    )
    expect(summary.beginningCash).toBe(500_000)
  })

  it("counts savings accounts as cash", () => {
    const withSavings: BankAccount[] = [
      ...bankAccounts,
      {
        name: "Reserve",
        accountType: "savings",
        balance: 120_000,
        availableCredit: 0,
        asOfDate: AS_OF,
      },
    ]
    const { summary } = calculateCashForecast(
      withSavings,
      [],
      [],
      [],
      13,
      AS_OF
    )
    expect(summary.beginningCash).toBe(620_000)
  })

  it("reports week 1 as the minimum week on a healthy flat forecast", () => {
    const { summary } = calculateCashForecast(
      bankAccounts,
      [],
      [],
      [],
      13,
      AS_OF
    )
    expect(summary.minBalanceWeek).toBe(1)
    expect(summary.minBalance).toBe(500_000)
  })

  it("collects overdue AR in week 1 instead of dropping it", () => {
    const overdue = invoice({ dueDate: "2026-06-01" })
    const { weeks } = calculateCashForecast(
      bankAccounts,
      [overdue],
      [],
      [],
      13,
      AS_OF
    )
    expect(weeks[0].arCollections).toBe(100_000)
    // and it should appear exactly once
    const total = weeks.reduce((s, w) => s + w.arCollections, 0)
    expect(total).toBe(100_000)
  })

  it("pays overdue bills in week 1 instead of dropping them", () => {
    const overdueBill = bill({ dueDate: "2026-05-15" })
    const { weeks } = calculateCashForecast(
      bankAccounts,
      [],
      [overdueBill],
      [],
      13,
      AS_OF
    )
    expect(weeks[0].apPayments).toBe(40_000)
  })

  it("places future items in the correct week", () => {
    const wk3 = invoice({ dueDate: "2026-09-02" }) // Mon 08-31 .. Sun 09-06
    const { weeks } = calculateCashForecast(
      bankAccounts,
      [wk3],
      [],
      [],
      13,
      AS_OF
    )
    expect(weeks[2].arCollections).toBe(100_000)
    expect(weeks[0].arCollections).toBe(0)
  })

  it("projects average weekly payroll as an outflow every week", () => {
    const { weeks } = calculateCashForecast(
      bankAccounts,
      [],
      [],
      payroll,
      13,
      AS_OF
    )
    for (const w of weeks) {
      expect(w.payroll).toBe(30_000)
    }
    expect(weeks[12].endingBalance).toBe(500_000 - 13 * 30_000)
  })

  it("only counts unpaid remainder of partially paid invoices", () => {
    const partial = invoice({ amount: 100_000, amountPaid: 60_000 })
    const { weeks } = calculateCashForecast(
      bankAccounts,
      [partial],
      [],
      [],
      13,
      AS_OF
    )
    expect(weeks[0].arCollections).toBe(40_000)
  })

  it("tracks the minimum balance week", () => {
    const bigBill = bill({ amount: 600_000, dueDate: "2026-08-20" })
    const lateInvoice = invoice({ dueDate: "2026-09-10" })
    const { summary } = calculateCashForecast(
      bankAccounts,
      [lateInvoice],
      [bigBill],
      [],
      13,
      AS_OF
    )
    expect(summary.minBalance).toBe(-100_000)
    expect(summary.minBalanceWeek).toBe(1)
  })
})

describe("calculateArAging", () => {
  it("buckets by days overdue relative to due date", () => {
    const invoices = [
      invoice({ id: "A", dueDate: "2026-08-25" }), // not yet due
      invoice({ id: "B", dueDate: "2026-08-01" }), // 18 days overdue
      invoice({ id: "C", dueDate: "2026-07-01" }), // 49 days
      invoice({ id: "D", dueDate: "2026-06-01" }), // 79 days
      invoice({ id: "E", dueDate: "2026-04-01" }), // 140 days
    ]
    const { totals } = calculateArAging(invoices, AS_OF)
    expect(totals.current).toBe(100_000)
    expect(totals.days30).toBe(100_000)
    expect(totals.days60).toBe(100_000)
    expect(totals.days90).toBe(100_000)
    expect(totals.days120Plus).toBe(100_000)
    expect(totals.total).toBe(500_000)
  })

  it("excludes paid invoices and fully-paid amounts", () => {
    const invoices = [
      invoice({ id: "A", status: "paid", amountPaid: 100_000 }),
      invoice({ id: "B", amountPaid: 100_000 }), // open but fully paid
    ]
    const { totals, buckets } = calculateArAging(invoices, AS_OF)
    expect(totals.total).toBe(0)
    expect(buckets).toHaveLength(0)
  })

  it("groups by customer sorted by total descending", () => {
    const invoices = [
      invoice({ id: "A", customer: "Small Co", amount: 10_000 }),
      invoice({ id: "B", customer: "Big Co", amount: 900_000 }),
    ]
    const { buckets } = calculateArAging(invoices, AS_OF)
    expect(buckets[0].customer).toBe("Big Co")
  })
})

describe("calculateApSchedule", () => {
  it("does not flag a bill due today as overdue", () => {
    const { totals } = calculateApSchedule(
      [bill({ dueDate: AS_OF, amount: 5_000 })],
      AS_OF
    )
    expect(totals.overdue).toBe(0)
    expect(totals.dueNext7).toBe(5_000)
  })

  it("computes overdue and upcoming totals", () => {
    const bills = [
      bill({ id: "A", dueDate: "2026-08-01", amount: 10_000 }), // overdue
      bill({ id: "B", dueDate: "2026-08-22", amount: 20_000 }), // next 7
      bill({ id: "C", dueDate: "2026-09-10", amount: 30_000 }), // next 30
      bill({ id: "D", dueDate: "2026-12-01", amount: 40_000 }), // beyond
      bill({ id: "E", dueDate: "2026-08-22", status: "paid" }),
    ]
    const { totals } = calculateApSchedule(bills, AS_OF)
    expect(totals.outstanding).toBe(100_000)
    expect(totals.overdue).toBe(10_000)
    expect(totals.dueNext7).toBe(20_000)
    expect(totals.dueNext30).toBe(50_000)
  })
})
