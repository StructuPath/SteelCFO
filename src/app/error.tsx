"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-cyber-black">
      <div className="w-full max-w-md space-y-6 px-6 text-center">
        <div className="hud-corners mx-auto flex h-20 w-20 items-center justify-center rounded-sm border border-neon-red/30 bg-neon-red/5">
          <span className="font-display text-3xl text-neon-red">⚠</span>
        </div>
        <div>
          <h1 className="font-display text-lg font-bold uppercase tracking-[0.15em] text-hud-text">
            System Fault
          </h1>
          <p className="mt-2 font-mono text-xs text-hud-dim">
            Something went wrong while rendering this view. The error has been
            logged.
          </p>
          {error.digest && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.15em] text-hud-dim">
              Ref: {error.digest}
            </p>
          )}
        </div>
        <Button onClick={reset}>Retry</Button>
      </div>
    </div>
  )
}
