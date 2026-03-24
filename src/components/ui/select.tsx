import * as React from "react"
import { cn } from "@/lib/utils"

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-9 w-full rounded-sm border border-grid-line bg-cyber-dark/60 px-3 py-2 font-mono text-xs text-hud-text backdrop-blur-sm",
      "focus:border-neon-cyan/50 focus:outline-none focus:shadow-neon-cyan",
      "disabled:cursor-not-allowed disabled:opacity-30",
      className
    )}
    {...props}
  >
    {children}
  </select>
))
Select.displayName = "Select"

export { Select }
