import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  variant?: "default" | "success" | "warning" | "danger"
}

const Progress = React.forwardRef<
  HTMLDivElement,
  ProgressProps
>(
  (
    {
      className,
      value = 0,
      variant = "default",
      ...props
    },
    ref
  ) => {
    const colors = {
      default:
        "bg-neon-cyan shadow-[0_0_8px_rgba(0,255,255,0.4)]",
      success:
        "bg-neon-green shadow-[0_0_8px_rgba(0,255,65,0.4)]",
      warning:
        "bg-neon-orange shadow-[0_0_8px_rgba(255,107,0,0.4)]",
      danger:
        "bg-neon-red shadow-[0_0_8px_rgba(255,0,64,0.4)]",
    }

    const clamped = Math.min(100, Math.max(0, value))

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn(
          "relative h-1.5 w-full overflow-hidden rounded-full bg-cyber-surface",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            colors[variant]
          )}
          style={{
            width: `${clamped}%`,
          }}
        />
      </div>
    )
  }
)
Progress.displayName = "Progress"

export { Progress }
