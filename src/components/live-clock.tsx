"use client"

import { useEffect, useState } from "react"

/**
 * Ticking clock rendered entirely on the client so it shows the viewer's
 * local time and actually updates. Renders nothing until mounted to avoid
 * a server/client hydration mismatch.
 */
export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    const tick = () => setNow(new Date())
    const first = setTimeout(tick, 0)
    const id = setInterval(tick, 1000)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [])

  if (!now) {
    return (
      <div className="text-right">
        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-hud-muted">
          --/--/----
        </p>
        <p className="font-mono text-[10px] tabular-nums text-neon-cyan">
          --:--:--
        </p>
      </div>
    )
  }

  return (
    <div className="text-right">
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-hud-muted">
        {now.toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })}
      </p>
      <p className="font-mono text-[10px] tabular-nums text-neon-cyan">
        {now.toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}
      </p>
    </div>
  )
}
