"use client"

import { useEffect, useState } from "react"

/**
 * Renders today's date in the viewer's timezone. Client-only to avoid
 * showing the server's timezone (which can differ by a calendar day).
 */
export function LocalDate() {
  const [dateStr, setDateStr] = useState<string | null>(null)

  useEffect(() => {
    const t = setTimeout(() => {
      setDateStr(
        new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      )
    }, 0)
    return () => clearTimeout(t)
  }, [])

  return <>{dateStr ?? "…"}</>
}
