"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsCtx {
  value: string
  onChange: (v: string) => void
}

const Ctx = React.createContext<TabsCtx>({
  value: "",
  onChange: () => {},
})

function Tabs({
  defaultValue,
  value,
  onValueChange,
  className,
  children,
  ...props
}: {
  defaultValue?: string
  value?: string
  onValueChange?: (v: string) => void
} & React.HTMLAttributes<HTMLDivElement>) {
  const [internal, setInternal] = React.useState(
    defaultValue ?? ""
  )

  return (
    <Ctx.Provider
      value={{
        value: value ?? internal,
        onChange: onValueChange ?? setInternal,
      }}
    >
      <div className={className} {...props}>
        {children}
      </div>
    </Ctx.Provider>
  )
}

function TabsList({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0 rounded-sm border border-grid-line bg-cyber-dark/60 p-0.5",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  value,
  className,
  children,
  ...props
}: { value: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(Ctx)
  const active = ctx.value === value

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-sm px-4 py-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.2em] transition-all duration-200",
        active
          ? "border border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan shadow-neon-cyan"
          : "border border-transparent text-hud-muted hover:text-hud-text",
        className
      )}
      onClick={() => ctx.onChange(value)}
      {...props}
    >
      {children}
    </button>
  )
}

function TabsContent({
  value,
  className,
  children,
  ...props
}: { value: string } & React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(Ctx)
  if (ctx.value !== value) return null

  return (
    <div className={cn("mt-4", className)} {...props}>
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
