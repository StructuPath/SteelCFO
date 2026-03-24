import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import { DemoBanner } from "@/components/demo-banner"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  // If not in demo mode and not authenticated, redirect to login
  if (!session && process.env.DEMO_MODE !== "true") {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-cyber-black">
      <DemoBanner />
      <Sidebar />
      <div className="ml-64">
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
