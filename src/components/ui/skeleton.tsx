import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-sm bg-gradient-to-r from-cyber-surface via-neon-cyan/5 to-cyber-surface bg-[length:200%_100%]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
