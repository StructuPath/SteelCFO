"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password.")
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setError("An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cyber-black">
      <div className="w-full max-w-sm space-y-8 px-6">
        {/* Logo / Brand */}
        <div className="text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="hud-corners flex h-20 w-20 items-center justify-center rounded-sm border border-neon-cyan/30 bg-neon-cyan/5 shadow-neon-cyan">
              <div className="text-center">
                <p className="font-display text-lg font-bold text-neon-cyan text-glow-cyan">
                  CFO
                </p>
                <p className="font-mono text-[7px] uppercase tracking-[0.2em] text-neon-cyan/50">
                  STEEL
                </p>
              </div>
            </div>
          </div>
          <h1 className="font-display text-xl font-bold uppercase tracking-[0.15em] text-hud-text">
            SteelCFO
          </h1>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-hud-dim">
            Financial Command Center
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-hud-dim">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@steelcfo.com"
                required
                autoFocus
                className="border-grid-line bg-cyber-dark/60 font-mono text-xs text-hud-text placeholder:text-hud-dim focus:border-neon-cyan/50 focus:shadow-neon-cyan"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-hud-dim">
                Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="border-grid-line bg-cyber-dark/60 font-mono text-xs text-hud-text placeholder:text-hud-dim focus:border-neon-cyan/50 focus:shadow-neon-cyan"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-sm border border-neon-red/30 bg-neon-red/10 px-3 py-2 font-mono text-[11px] text-neon-red">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading}
            loading={isLoading}
            className="w-full"
          >
            {isLoading ? "Authenticating..." : "Sign In"}
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-hud-dim">
            {"// Secure Access v2.0"}
          </p>
        </div>
      </div>
    </div>
  )
}
