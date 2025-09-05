import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, ...props }, ref) => {
    const isRTL = typeof window !== "undefined" && document?.documentElement?.dir === "rtl"

    return (
      <div
        ref={ref}
        className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}
        {...props}
      >
        <div
          className="h-full bg-green-600 transition-all duration-300"
          style={{
            width: `${value || 0}%`,
            transformOrigin: isRTL ? "right" : "left",
          }}
        />
      </div>
    )
  }
)

Progress.displayName = "Progress"

export { Progress }
