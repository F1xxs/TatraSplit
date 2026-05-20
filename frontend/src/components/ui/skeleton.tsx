import { cn } from "@/lib/utils";
import React, { HTMLAttributes } from "react";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  function Skeleton({ className, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-md bg-[var(--color-secondary)] relative overflow-hidden",
          className,
        )}
        style={{
          backgroundImage:
            "linear-gradient(90deg, hsl(240 5% 13%) 0%, hsl(240 5% 18%) 50%, hsl(240 5% 13%) 100%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 2s ease-in-out infinite",
        }}
        {...props}
      />
    );
  },
);
