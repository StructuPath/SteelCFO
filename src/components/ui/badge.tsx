import * as React from "react"
import {
  cva,
  type VariantProps,
} from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-sm px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] transition-colors border",
  {
    variants: {
      variant: {
        default:
          "border-neon-cyan/40 bg-neon-cyan/10 text-neon-cyan shadow-[0_0_5px_rgba(0,255,255,0.15)]",
        secondary:
          "border-neon-blue/40 bg-neon-blue/10 text-neon-blue",
        success:
          "border-neon-green/40 bg-neon-green/10 text-neon-green shadow-[0_0_5px_rgba(0,255,65,0.15)]",
        warning:
          "border-neon-orange/40 bg-neon-orange/10 text-neon-orange shadow-[0_0_5px_rgba(255,107,0,0.15)]",
        danger:
          "border-neon-red/40 bg-neon-red/10 text-neon-red shadow-[0_0_5px_rgba(255,0,64,0.15)]",
        outline:
          "border-grid-bright bg-transparent text-hud-muted",
        magenta:
          "border-neon-magenta/40 bg-neon-magenta/10 text-neon-magenta shadow-[0_0_5px_rgba(255,0,255,0.15)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<
  HTMLDivElement,
  BadgeProps
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      badgeVariants({ variant }),
      className
    )}
    {...props}
  />
))
Badge.displayName = "Badge"

export { Badge, badgeVariants }
