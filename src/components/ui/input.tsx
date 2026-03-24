import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-9 w-full rounded-sm border border-grid-line bg-cyber-dark/60 px-3 py-2 font-mono text-sm text-hud-text backdrop-blur-sm",
      "placeholder:text-hud-dim",
      "focus:border-neon-cyan/50 focus:outline-none focus:shadow-neon-cyan",
      "disabled:cursor-not-allowed disabled:opacity-30",
      "transition-all duration-200",
      className
    )}
    ref={ref}
    {...props}
  />
))
Input.displayName = "Input"

export { Input }
