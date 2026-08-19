import { prisma } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Liveness/readiness probe for load balancers and uptime monitors.
 * Verifies the database connection is reachable.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return Response.json({ status: "ok" })
  } catch {
    return Response.json(
      { status: "unavailable", reason: "database unreachable" },
      { status: 503 }
    )
  }
}
