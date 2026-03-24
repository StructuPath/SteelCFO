import * as React from "react"
import {
  cva,
  type VariantProps,
} from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-mono text-xs font-medium uppercase tracking-[0.15em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-cyan disabled:pointer-events-none disabled:opacity-30 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "border border-neon-cyan bg-neon-cyan/10 text-neon-cyan shadow-neon-cyan hover:bg-neon-cyan/20 hover:shadow-neon-cyan-lg",
        destructive:
          "border border-neon-red bg-neon-red/10 text-neon-red shadow-neon-red hover:bg-neon-red/20",
        success:
          "border border-neon-green bg-neon-green/10 text-neon-green shadow-neon-green hover:bg-neon-green/20",
        magenta:
          "border border-neon-magenta bg-neon-magenta/10 text-neon-magenta shadow-neon-magenta hover:bg-neon-magenta/20",
        outline:
          "border border-grid-bright bg-transparent text-hud-text hover:border-neon-cyan hover:text-neon-cyan hover:shadow-neon-cyan",
        ghost:
          "text-hud-muted hover:bg-cyber-surface hover:text-neon-cyan",
        link: "text-neon-cyan underline-offset-4 hover:underline hover:text-neon-cyan/80",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-7 px-3 text-[10px]",
        lg: "h-11 px-8 text-sm",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
}

const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(
  (
    {
      className,
      variant,
      size,
      loading,
      children,
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      className={cn(
        buttonVariants({ variant, size }),
        className
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && (
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-neon-cyan opacity-40" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-neon-cyan" />
        </span>
      )}
      {children}
    </button>
  )
)
Button.displayName = "Button"

export { Button, buttonVariants }
