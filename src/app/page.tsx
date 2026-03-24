import { redirect } from "next/navigation"
import { auth } from "@/auth"

export default async function Home() {
  const session = await auth()

  if (session || process.env.DEMO_MODE === "true") {
    redirect("/dashboard")
  }

  redirect("/login")
}
