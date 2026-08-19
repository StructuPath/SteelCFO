/**
 * SteelCFO Server-Side Data Layer
 *
 * Fetches data from Prisma and converts Prisma models (with Decimal fields)
 * into plain engine types (with number fields) for use in computation engines
 * and React Server Components.
 *
 * All functions are async and intended for server-side use only.
 */

import { prisma } from "./db"
import { auth } from "@/auth"
import type {
  Job,
  CostRecord,
  Invoice,
  Bill,
  ChangeOrder,
  PayrollRecord,
  BankAccount,
} from "./engines/types"

// Demo organization ID (matches prisma/seed.ts)
const DEMO_ORG_ID = "demo-steel-co"

/**
 * Resolve the organization ID from the current session.
 * Falls back to DEMO_ORG_ID only when DEMO_MODE is enabled.
 * Throws when unauthenticated outside demo mode — data must never be
 * served across org boundaries.
 */
export async function getOrgId(): Promise<string> {
  const session = await auth()
  const orgId = session?.user?.organizationId
  if (orgId) return orgId
  if (process.env.DEMO_MODE === "true") return DEMO_ORG_ID
  throw new Error("Unauthorized: no organization in session")
}

/**
 * Safely convert Prisma Decimal, number, or string to a plain number.
 * Prisma Decimal objects have a `.toNumber()` method.
 */
function toNumber(val: unknown): number {
  if (typeof val === "number") return val
  if (
    typeof val === "object" &&
    val !== null &&
    "toNumber" in val &&
    typeof (val as { toNumber: () => number }).toNumber === "function"
  ) {
    return (val as { toNumber: () => number }).toNumber()
  }
  return Number(val) || 0
}

/** Convert a Date to YYYY-MM-DD string. */
function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0]
}

// ---------------------------------------------------------------------------
// Individual Data Fetchers
// ---------------------------------------------------------------------------

export async function getJobs(
  orgId = DEMO_ORG_ID
): Promise<Job[]> {
  const jobs = await prisma.job.findMany({
    where: { organizationId: orgId },
    orderBy: { id: "asc" },
  })

  return jobs.map((j) => ({
    id: j.id,
    name: j.name,
    customer: j.customer,
    contractValue: toNumber(j.contractValue),
    estimatedCost: toNumber(j.estimatedCost),
    status: j.status,
    type: j.type,
    tons: j.tons,
    startDate: toDateStr(j.startDate),
    endDate: j.endDate ? toDateStr(j.endDate) : null,
    percentComplete: j.percentComplete,
  }))
}

export async function getCosts(
  orgId = DEMO_ORG_ID
): Promise<CostRecord[]> {
  const costs = await prisma.costRecord.findMany({
    where: { organizationId: orgId },
  })

  return costs.map((c) => ({
    jobId: c.jobId,
    costCode: c.costCode,
    description: c.description,
    budgetAmount: toNumber(c.budgetAmount),
    actualAmount: toNumber(c.actualAmount),
    committedAmount: toNumber(c.committedAmount),
    costType: c.costType,
    period: c.period ?? undefined,
  }))
}

export async function getInvoices(
  orgId = DEMO_ORG_ID
): Promise<Invoice[]> {
  const invoices = await prisma.invoice.findMany({
    where: { organizationId: orgId },
  })

  return invoices.map((i) => ({
    id: i.id,
    jobId: i.jobId,
    customer: i.customer,
    amount: toNumber(i.amount),
    amountPaid: toNumber(i.amountPaid),
    invoiceDate: toDateStr(i.invoiceDate),
    dueDate: toDateStr(i.dueDate),
    paidDate: i.paidDate ? toDateStr(i.paidDate) : null,
    status: i.status,
    retainage: toNumber(i.retainage),
  }))
}

export async function getBills(
  orgId = DEMO_ORG_ID
): Promise<Bill[]> {
  const bills = await prisma.bill.findMany({
    where: { organizationId: orgId },
  })

  return bills.map((b) => ({
    id: b.id,
    jobId: b.jobId,
    vendor: b.vendor,
    amount: toNumber(b.amount),
    dueDate: toDateStr(b.dueDate),
    paidDate: b.paidDate ? toDateStr(b.paidDate) : null,
    status: b.status,
    category: b.category,
  }))
}

export async function getChangeOrders(
  orgId = DEMO_ORG_ID
): Promise<ChangeOrder[]> {
  const cos = await prisma.changeOrder.findMany({
    where: { organizationId: orgId },
  })

  return cos.map((co) => ({
    id: co.id,
    jobId: co.jobId,
    description: co.description,
    amount: toNumber(co.amount),
    status: co.status,
    submittedDate: toDateStr(co.submittedDate),
    approvedDate: co.approvedDate
      ? toDateStr(co.approvedDate)
      : null,
    probability: co.probability,
  }))
}

export async function getPayroll(
  orgId = DEMO_ORG_ID
): Promise<PayrollRecord[]> {
  const records = await prisma.payrollRecord.findMany({
    where: { organizationId: orgId },
    orderBy: { weekEnding: "desc" },
  })

  return records.map((p) => ({
    jobId: p.jobId,
    weekEnding: toDateStr(p.weekEnding),
    employees: p.employees,
    straightHours: p.straightHours,
    overtimeHours: p.overtimeHours,
    totalHours: p.totalHours,
    grossPay: toNumber(p.grossPay),
    tonsInstalled: p.tonsInstalled,
    hoursPerTon: p.hoursPerTon,
  }))
}

export async function getBankAccounts(
  orgId = DEMO_ORG_ID
): Promise<BankAccount[]> {
  const accounts = await prisma.bankAccount.findMany({
    where: { organizationId: orgId },
    orderBy: { asOfDate: "desc" },
  })

  // De-duplicate: keep only the most recent balance per account name
  const latest = new Map<string, (typeof accounts)[0]>()
  for (const a of accounts) {
    if (!latest.has(a.name)) {
      latest.set(a.name, a)
    }
  }

  return Array.from(latest.values()).map((a) => ({
    name: a.name,
    accountType: a.accountType,
    balance: toNumber(a.balance),
    availableCredit: toNumber(a.availableCredit),
    asOfDate: toDateStr(a.asOfDate),
  }))
}

// ---------------------------------------------------------------------------
// Batch Fetcher (all data at once for dashboard)
// ---------------------------------------------------------------------------

export async function getAllData(orgId?: string) {
  if (!orgId) orgId = await getOrgId()

  const [
    jobs,
    costs,
    invoices,
    bills,
    changeOrders,
    payroll,
    bankAccounts,
  ] = await Promise.all([
    getJobs(orgId),
    getCosts(orgId),
    getInvoices(orgId),
    getBills(orgId),
    getChangeOrders(orgId),
    getPayroll(orgId),
    getBankAccounts(orgId),
  ])

  return {
    jobs,
    costs,
    invoices,
    bills,
    changeOrders,
    payroll,
    bankAccounts,
  }
}
