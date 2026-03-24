/**
 * SteelCFO Database Seed
 *
 * Reads all 7 CSV files from data/sample/ and inserts them into the database.
 * Uses upsert operations to be fully idempotent — safe to run multiple times.
 *
 * Usage: npm run db:seed
 */

import { PrismaClient, Prisma } from "@prisma/client"
import { readFileSync } from "fs"
import { resolve } from "path"
import { hashSync } from "bcryptjs"

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// CSV Parsing
// ---------------------------------------------------------------------------

interface CsvRow {
  [key: string]: string
}

function parseCsv(filePath: string): CsvRow[] {
  const raw = readFileSync(filePath, "utf-8")
  const lines = raw.split("\n").filter((line) => line.trim() !== "")

  if (lines.length < 2) return []

  const headers = lines[0].split(",").map((h) => h.trim())
  const rows: CsvRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim())
    const row: CsvRow = {}
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] ?? ""
    }
    rows.push(row)
  }

  return rows
}

function csvPath(filename: string): string {
  return resolve(__dirname, "..", "data", "sample", filename)
}

// ---------------------------------------------------------------------------
// Type Conversions
// ---------------------------------------------------------------------------

function toDecimal(value: string): Prisma.Decimal {
  const cleaned = value.replace(/[$,]/g, "")
  const num = Number(cleaned)
  return new Prisma.Decimal(isNaN(num) ? 0 : num)
}

function toFloat(value: string): number {
  const cleaned = value.replace(/[$,]/g, "")
  const num = Number(cleaned)
  return isNaN(num) ? 0 : num
}

function toInt(value: string): number {
  const num = parseInt(value, 10)
  return isNaN(num) ? 0 : num
}

function toDate(value: string): Date {
  return new Date(value + "T00:00:00.000Z")
}

function toDateOrNull(value: string): Date | null {
  if (!value || value.trim() === "") return null
  return toDate(value)
}

/**
 * Map cost codes to CostType enum values.
 *
 * 0100 = material (Steel Material)
 * 0200 = labor    (Shop Labor)
 * 0300 = labor    (Field Labor)
 * 0400 = equipment
 * 0500 = sub      (Subcontract)
 * 0600 = engineering
 * 0700 = coatings (Paint/Coatings)
 */
function costCodeToType(
  costCode: string
): "material" | "labor" | "equipment" | "sub" | "engineering" | "coatings" {
  switch (costCode) {
    case "0100":
      return "material"
    case "0200":
    case "0300":
      return "labor"
    case "0400":
      return "equipment"
    case "0500":
      return "sub"
    case "0600":
      return "engineering"
    case "0700":
      return "coatings"
    default:
      return "material"
  }
}

/**
 * Map job status string to JobStatus enum.
 * The CSV uses "complete" but the enum is "complete".
 */
function toJobStatus(
  value: string
): "active" | "complete" | "pending" | "bidding" {
  const lower = value.toLowerCase().trim()
  switch (lower) {
    case "active":
      return "active"
    case "complete":
    case "completed":
    case "closed":
      return "complete"
    case "pending":
      return "pending"
    case "bidding":
    case "bid":
      return "bidding"
    default:
      return "active"
  }
}

/**
 * Map job type string to JobType enum.
 */
function toJobType(value: string): "structural" | "misc" | "ornamental" {
  const lower = value.toLowerCase().trim()
  switch (lower) {
    case "structural":
      return "structural"
    case "misc":
    case "miscellaneous":
      return "misc"
    case "ornamental":
      return "ornamental"
    default:
      return "structural"
  }
}

/**
 * Map invoice status string to InvoiceStatus enum.
 */
function toInvoiceStatus(value: string): "open" | "paid" | "partial" {
  const lower = value.toLowerCase().trim()
  switch (lower) {
    case "open":
      return "open"
    case "paid":
      return "paid"
    case "partial":
      return "partial"
    default:
      return "open"
  }
}

/**
 * Map bill status string to BillStatus enum.
 */
function toBillStatus(value: string): "open" | "paid" | "scheduled" {
  const lower = value.toLowerCase().trim()
  switch (lower) {
    case "open":
      return "open"
    case "paid":
      return "paid"
    case "scheduled":
      return "scheduled"
    default:
      return "open"
  }
}

/**
 * Map change order status string to ChangeOrderStatus enum.
 */
function toChangeOrderStatus(
  value: string
): "approved" | "pending" | "rejected" {
  const lower = value.toLowerCase().trim()
  switch (lower) {
    case "approved":
      return "approved"
    case "pending":
      return "pending"
    case "rejected":
      return "rejected"
    default:
      return "pending"
  }
}

/**
 * Derive bank account type from account name.
 */
function deriveAccountType(accountName: string): string {
  const lower = accountName.toLowerCase()
  if (lower.includes("operating")) return "checking"
  if (lower.includes("payroll")) return "checking"
  if (lower.includes("credit")) return "line_of_credit"
  if (lower.includes("savings")) return "savings"
  return "checking"
}

// ---------------------------------------------------------------------------
// Seed Functions
// ---------------------------------------------------------------------------

async function seedOrganization(): Promise<string> {
  const org = await prisma.organization.upsert({
    where: { id: "demo-steel-co" },
    update: { name: "Demo Steel Co" },
    create: {
      id: "demo-steel-co",
      name: "Demo Steel Co",
    },
  })
  console.log(`  ✓ Organization: ${org.name} (${org.id})`)
  return org.id
}

async function seedUser(orgId: string): Promise<string> {
  const user = await prisma.user.upsert({
    where: { email: "admin@steelcfo.com" },
    update: {
      name: "Steel CFO Admin",
      role: "ADMIN",
      passwordHash: hashSync("steelcfo2024", 10),
    },
    create: {
      email: "admin@steelcfo.com",
      name: "Steel CFO Admin",
      role: "ADMIN",
      passwordHash: hashSync("steelcfo2024", 10),
      organizationId: orgId,
    },
  })
  console.log(`  ✓ User: ${user.email} (${user.role})`)
  return user.id
}

async function seedJobs(orgId: string): Promise<void> {
  const rows = parseCsv(csvPath("jobs.csv"))
  console.log(`  → Parsing jobs.csv: ${rows.length} rows`)

  for (const row of rows) {
    await prisma.job.upsert({
      where: { id: row.job_id },
      update: {
        name: row.job_name,
        customer: row.customer,
        contractValue: toDecimal(row.contract_value),
        estimatedCost: toDecimal(row.estimated_cost),
        status: toJobStatus(row.status),
        type: toJobType(row.type),
        tons: toFloat(row.tons),
        startDate: toDate(row.start_date),
        endDate: toDateOrNull(row.end_date),
        organizationId: orgId,
      },
      create: {
        id: row.job_id,
        name: row.job_name,
        customer: row.customer,
        contractValue: toDecimal(row.contract_value),
        estimatedCost: toDecimal(row.estimated_cost),
        status: toJobStatus(row.status),
        type: toJobType(row.type),
        tons: toFloat(row.tons),
        startDate: toDate(row.start_date),
        endDate: toDateOrNull(row.end_date),
        organizationId: orgId,
      },
    })
  }

  console.log(`  ✓ Jobs: ${rows.length} upserted`)
}

async function seedCosts(orgId: string): Promise<void> {
  const rows = parseCsv(csvPath("costs.csv"))
  console.log(`  → Parsing costs.csv: ${rows.length} rows`)

  // Delete existing cost records for this org to avoid duplicates on re-seed
  // (CostRecord uses cuid() IDs, so we can't upsert by a natural key easily)
  await prisma.costRecord.deleteMany({ where: { organizationId: orgId } })

  for (const row of rows) {
    await prisma.costRecord.create({
      data: {
        jobId: row.job_id,
        costCode: row.cost_code,
        description: row.description,
        budgetAmount: toDecimal(row.budget),
        actualAmount: toDecimal(row.actual_cost),
        committedAmount: toDecimal(row.committed_cost),
        costType: costCodeToType(row.cost_code),
        period: row.period || null,
        organizationId: orgId,
      },
    })
  }

  console.log(`  ✓ Cost Records: ${rows.length} inserted`)
}

async function seedInvoices(orgId: string): Promise<void> {
  const rows = parseCsv(csvPath("ar.csv"))
  console.log(`  → Parsing ar.csv: ${rows.length} rows`)

  for (const row of rows) {
    const status = toInvoiceStatus(row.status)
    const amountPaid = toDecimal(row.paid_amount)
    // Derive paid date: if fully paid, use due_date as approximate paid date
    const paidDate =
      status === "paid" ? toDateOrNull(row.due_date) : null

    await prisma.invoice.upsert({
      where: { id: row.invoice_id },
      update: {
        jobId: row.job_id,
        customer: row.customer,
        invoiceNumber: row.invoice_id,
        amount: toDecimal(row.amount),
        amountPaid,
        invoiceDate: toDate(row.invoice_date),
        dueDate: toDate(row.due_date),
        paidDate,
        status,
        organizationId: orgId,
      },
      create: {
        id: row.invoice_id,
        jobId: row.job_id,
        customer: row.customer,
        invoiceNumber: row.invoice_id,
        amount: toDecimal(row.amount),
        amountPaid,
        invoiceDate: toDate(row.invoice_date),
        dueDate: toDate(row.due_date),
        paidDate,
        status,
        organizationId: orgId,
      },
    })
  }

  console.log(`  ✓ Invoices: ${rows.length} upserted`)
}

async function seedBills(orgId: string): Promise<void> {
  const rows = parseCsv(csvPath("ap.csv"))
  console.log(`  → Parsing ap.csv: ${rows.length} rows`)

  // Some AP rows have empty job_id (overhead items).
  // We need a "general" job to link those to, since Bill.jobId is required.
  // Create an overhead placeholder job if needed.
  const overheadJobId = "J-0000"
  await prisma.job.upsert({
    where: { id: overheadJobId },
    update: {},
    create: {
      id: overheadJobId,
      name: "General & Administrative",
      customer: "Internal",
      contractValue: new Prisma.Decimal(0),
      estimatedCost: new Prisma.Decimal(0),
      status: "active",
      type: "misc",
      tons: 0,
      startDate: new Date("2025-01-01T00:00:00.000Z"),
      organizationId: orgId,
    },
  })

  for (const row of rows) {
    const jobId = row.job_id && row.job_id.trim() !== "" ? row.job_id : overheadJobId
    const status = toBillStatus(row.status)
    const paidAmount = toFloat(row.paid)
    const paidDate =
      status === "paid" ? toDateOrNull(row.due_date) : null

    await prisma.bill.upsert({
      where: { id: row.bill_id },
      update: {
        jobId,
        vendor: row.vendor,
        billNumber: row.bill_id,
        amount: toDecimal(row.amount),
        dueDate: toDate(row.due_date),
        paidDate,
        status,
        category: row.category || "other",
        organizationId: orgId,
      },
      create: {
        id: row.bill_id,
        jobId,
        vendor: row.vendor,
        billNumber: row.bill_id,
        amount: toDecimal(row.amount),
        dueDate: toDate(row.due_date),
        paidDate,
        status,
        category: row.category || "other",
        organizationId: orgId,
      },
    })
  }

  console.log(`  ✓ Bills: ${rows.length} upserted`)
}

async function seedChangeOrders(orgId: string): Promise<void> {
  const rows = parseCsv(csvPath("change_orders.csv"))
  console.log(`  → Parsing change_orders.csv: ${rows.length} rows`)

  for (const row of rows) {
    const status = toChangeOrderStatus(row.status)
    const probability = toFloat(row.probability) / 100 // CSV stores as 0-100, schema stores 0-1

    await prisma.changeOrder.upsert({
      where: { id: row.co_id },
      update: {
        jobId: row.job_id,
        description: row.description,
        amount: toDecimal(row.amount),
        status,
        submittedDate: toDate(row.submitted_date),
        approvedDate: toDateOrNull(row.approved_date),
        probability,
        organizationId: orgId,
      },
      create: {
        id: row.co_id,
        jobId: row.job_id,
        description: row.description,
        amount: toDecimal(row.amount),
        status,
        submittedDate: toDate(row.submitted_date),
        approvedDate: toDateOrNull(row.approved_date),
        probability,
        organizationId: orgId,
      },
    })
  }

  console.log(`  ✓ Change Orders: ${rows.length} upserted`)
}

async function seedBankAccounts(orgId: string): Promise<void> {
  const rows = parseCsv(csvPath("bank.csv"))
  console.log(`  → Parsing bank.csv: ${rows.length} rows`)

  // Delete existing bank records to avoid duplicates (auto-ID, no natural key)
  await prisma.bankAccount.deleteMany({ where: { organizationId: orgId } })

  for (const row of rows) {
    const accountName = row.account
    const accountType = deriveAccountType(accountName)
    const balance = toDecimal(row.balance)
    const available = toDecimal(row.available)
    const asOfDate = toDate(row.date)

    // For line of credit, available credit is the "available" field
    // For checking accounts, balance equals available
    const isLineOfCredit = accountType === "line_of_credit"

    await prisma.bankAccount.create({
      data: {
        name: accountName,
        accountType,
        balance,
        availableCredit: isLineOfCredit ? available : new Prisma.Decimal(0),
        asOfDate,
        organizationId: orgId,
      },
    })
  }

  console.log(`  ✓ Bank Accounts: ${rows.length} inserted`)
}

async function seedPayroll(orgId: string): Promise<void> {
  const rows = parseCsv(csvPath("payroll.csv"))
  console.log(`  → Parsing payroll.csv: ${rows.length} rows`)

  // Delete existing payroll records to avoid duplicates
  await prisma.payrollRecord.deleteMany({ where: { organizationId: orgId } })

  for (const row of rows) {
    const straightHours = toFloat(row.regular_hours)
    const overtimeHours = toFloat(row.overtime_hours)
    const totalHours = straightHours + overtimeHours
    const hoursPerTon = toFloat(row.hours_per_ton)
    // Estimate tons installed from hours_per_ton: tons = total_hours / hours_per_ton
    const tonsInstalled = hoursPerTon > 0 ? totalHours / hoursPerTon : 0

    await prisma.payrollRecord.create({
      data: {
        jobId: row.job_id,
        weekEnding: toDate(row.week_ending),
        employees: toInt(row.employee_count),
        straightHours,
        overtimeHours,
        totalHours,
        grossPay: toDecimal(row.total_cost),
        tonsInstalled: Math.round(tonsInstalled * 100) / 100,
        hoursPerTon,
        organizationId: orgId,
      },
    })
  }

  console.log(`  ✓ Payroll Records: ${rows.length} inserted`)
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("")
  console.log("╔══════════════════════════════════════════╗")
  console.log("║  SteelCFO Database Seed                  ║")
  console.log("╚══════════════════════════════════════════╝")
  console.log("")

  console.log("1. Creating organization and admin user...")
  const orgId = await seedOrganization()
  await seedUser(orgId)
  console.log("")

  console.log("2. Seeding jobs...")
  await seedJobs(orgId)
  console.log("")

  console.log("3. Seeding cost records...")
  await seedCosts(orgId)
  console.log("")

  console.log("4. Seeding invoices (AR)...")
  await seedInvoices(orgId)
  console.log("")

  console.log("5. Seeding bills (AP)...")
  await seedBills(orgId)
  console.log("")

  console.log("6. Seeding change orders...")
  await seedChangeOrders(orgId)
  console.log("")

  console.log("7. Seeding bank accounts...")
  await seedBankAccounts(orgId)
  console.log("")

  console.log("8. Seeding payroll records...")
  await seedPayroll(orgId)
  console.log("")

  // Print summary
  const jobCount = await prisma.job.count({ where: { organizationId: orgId } })
  const costCount = await prisma.costRecord.count({ where: { organizationId: orgId } })
  const invoiceCount = await prisma.invoice.count({ where: { organizationId: orgId } })
  const billCount = await prisma.bill.count({ where: { organizationId: orgId } })
  const coCount = await prisma.changeOrder.count({ where: { organizationId: orgId } })
  const bankCount = await prisma.bankAccount.count({ where: { organizationId: orgId } })
  const payrollCount = await prisma.payrollRecord.count({ where: { organizationId: orgId } })

  console.log("┌──────────────────────────────────────────┐")
  console.log("│  Seed Summary                            │")
  console.log("├──────────────────────────────────────────┤")
  console.log(`│  Jobs:            ${String(jobCount).padStart(4)}                   │`)
  console.log(`│  Cost Records:    ${String(costCount).padStart(4)}                   │`)
  console.log(`│  Invoices (AR):   ${String(invoiceCount).padStart(4)}                   │`)
  console.log(`│  Bills (AP):      ${String(billCount).padStart(4)}                   │`)
  console.log(`│  Change Orders:   ${String(coCount).padStart(4)}                   │`)
  console.log(`│  Bank Accounts:   ${String(bankCount).padStart(4)}                   │`)
  console.log(`│  Payroll Records: ${String(payrollCount).padStart(4)}                   │`)
  console.log("└──────────────────────────────────────────┘")
  console.log("")
  console.log("✅ Seed complete!")
  console.log("")
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e)
    await prisma.$disconnect()
    process.exit(1)
  })
