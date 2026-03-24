"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navItems = [
  {
    href: "/dashboard",
    label: "COMMAND",
    icon: "⬡",
    desc: "SYS OVERVIEW",
  },
  {
    href: "/dashboard/jobs",
    label: "PROJECTS",
    icon: "◈",
    desc: "JOB MATRIX",
  },
  {
    href: "/dashboard/cash",
    label: "TREASURY",
    icon: "◇",
    desc: "CASH FLOW",
  },
  {
    href: "/dashboard/receivables",
    label: "INBOUND",
    icon: "▷",
    desc: "AR AGING",
  },
  {
    href: "/dashboard/payables",
    label: "OUTBOUND",
    icon: "◁",
    desc: "AP SCHEDULE",
  },
  {
    href: "/dashboard/risk",
    label: "THREATS",
    icon: "⚡",
    desc: "RISK ENGINE",
  },
  {
    href: "/dashboard/reports",
    label: "REPORTS",
    icon: "▤",
    desc: "WIP / BACKLOG",
  },
  {
    href: "/dashboard/chat",
    label: "NEURAL",
    icon: "◉",
    desc: "AI INTERFACE",
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-grid-line bg-cyber-void/95 backdrop-blur-xl">
      {/* Logo */}
      <div className="relative flex h-16 items-center gap-3 border-b border-grid-line px-5">
        <div className="relative flex h-9 w-9 items-center justify-center">
          <div className="absolute inset-0 animate-tron-glow rounded-sm border border-neon-cyan/50 bg-neon-cyan/10" />
          <span className="relative font-display text-lg font-bold text-neon-cyan text-glow-cyan">
            S
          </span>
        </div>
        <div>
          <h1 className="font-display text-sm font-bold uppercase tracking-[0.3em] text-neon-cyan text-glow-cyan">
            STEELCFO
          </h1>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 animate-glow-pulse rounded-full bg-neon-green" />
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-neon-green/70">
              SYSTEM ONLINE
            </p>
          </div>
        </div>
      </div>

      {/* Nav label */}
      <div className="px-5 pb-2 pt-5">
        <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-hud-dim">
          {"// Navigation"}
        </p>
      </div>

      {/* Nav items */}
      <nav className="no-scrollbar flex-1 space-y-0.5 overflow-y-auto px-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-sm border-l-2 px-3 py-2.5 font-mono text-xs transition-all duration-200",
                isActive
                  ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan shadow-neon-cyan"
                  : "border-transparent text-hud-muted hover:bg-cyber-surface hover:text-hud-text"
              )}
            >
              <span
                className={cn(
                  "text-base transition-all",
                  isActive
                    ? "text-neon-cyan text-glow-cyan"
                    : "text-hud-dim group-hover:text-hud-muted"
                )}
              >
                {item.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-[11px] font-semibold uppercase tracking-[0.15em]",
                    isActive ? "text-neon-cyan" : ""
                  )}
                >
                  {item.label}
                </p>
                <p
                  className={cn(
                    "text-[8px] uppercase tracking-[0.15em]",
                    isActive
                      ? "text-neon-cyan/50"
                      : "text-hud-dim"
                  )}
                >
                  {item.desc}
                </p>
              </div>
              {isActive && (
                <div className="flex h-4 items-center">
                  <span className="h-1 w-1 animate-glow-pulse rounded-full bg-neon-cyan shadow-[0_0_4px_rgba(0,255,255,0.8)]" />
                </div>
              )}
            </Link>
          )
        })}
      </nav>

      {/* System status */}
      <div className="border-t border-grid-line p-4">
        <div className="rounded-sm border border-grid-dim bg-cyber-deep/60 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-hud-dim">
              SYS STATUS
            </p>
            <span className="h-1.5 w-1.5 animate-glow-pulse rounded-full bg-neon-cyan" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="font-mono text-[9px] text-hud-dim">
                MODE
              </span>
              <span className="font-mono text-[9px] text-neon-green">
                DEMO
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-[9px] text-hud-dim">
                DATA
              </span>
              <span className="font-mono text-[9px] text-neon-cyan">
                LOADED
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-[9px] text-hud-dim">
                AI
              </span>
              <span className="font-mono text-[9px] text-neon-magenta">
                READY
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
