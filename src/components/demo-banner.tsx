export function DemoBanner() {
  if (process.env.DEMO_MODE !== "true") return null

  return (
    <div className="border-b border-neon-yellow/20 bg-neon-yellow/5 px-4 py-1.5 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-neon-yellow/70">
      {"// Demo Mode — authentication bypassed"}
    </div>
  )
}
