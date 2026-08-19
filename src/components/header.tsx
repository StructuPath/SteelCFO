import { LiveClock } from "@/components/live-clock"

function initials(name: string | null): string {
  if (!name) return "––"
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ""
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ""
  return (first + last).toUpperCase() || "––"
}

export function Header({
  userName,
  userRole,
}: {
  userName: string | null
  userRole: string | null
}) {
  return (
    <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-grid-line bg-cyber-void/90 px-6 backdrop-blur-xl">
      {/* Left: Tagline */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="h-px w-8 bg-gradient-to-r from-neon-cyan/60 to-transparent" />
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-hud-muted">
            <span className="text-neon-cyan">
              PROTECT
            </span>{" "}
            CASH ·{" "}
            <span className="text-neon-green">
              PROTECT
            </span>{" "}
            MARGIN ·{" "}
            <span className="text-neon-magenta">
              REDUCE
            </span>{" "}
            SURPRISES
          </p>
          <span className="h-px w-8 bg-gradient-to-l from-neon-magenta/60 to-transparent" />
        </div>
      </div>

      {/* Right: System readouts */}
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-3">
          <LiveClock />
          <div className="h-6 w-px bg-grid-line" />
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-hud-muted">
              OPERATOR
            </p>
            <p className="font-mono text-[10px] uppercase text-neon-green">
              {userRole ?? "guest"}
            </p>
          </div>
        </div>
        <div
          className="flex h-7 w-7 items-center justify-center rounded-sm border border-neon-cyan/30 bg-neon-cyan/10"
          title={userName ?? undefined}
        >
          <span className="font-display text-[10px] font-bold text-neon-cyan">
            {initials(userName)}
          </span>
        </div>
      </div>
    </header>
  )
}
