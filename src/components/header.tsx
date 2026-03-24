export function Header() {
  const now = new Date()
  const timeStr = now.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
  const dateStr = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

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
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-hud-muted">
              {dateStr}
            </p>
            <p className="font-mono text-[10px] tabular-nums text-neon-cyan">
              {timeStr}
            </p>
          </div>
          <div className="h-6 w-px bg-grid-line" />
          <div className="text-right">
            <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-hud-muted">
              OPERATOR
            </p>
            <p className="font-mono text-[10px] text-neon-green">
              ADMIN
            </p>
          </div>
        </div>
        <div className="flex h-7 w-7 items-center justify-center rounded-sm border border-neon-cyan/30 bg-neon-cyan/10">
          <span className="font-display text-[10px] font-bold text-neon-cyan">
            DS
          </span>
        </div>
      </div>
    </header>
  )
}
