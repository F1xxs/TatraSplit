import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import React, { HTMLAttributes } from "react";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--color-primary)]/15 text-[var(--color-primary)]",
        secondary:
          "border-transparent bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]",
        success:
          "border-transparent bg-[var(--color-success)]/15 text-[var(--color-success)]",
        danger:
          "border-transparent bg-[var(--color-destructive)]/15 text-[var(--color-destructive)]",
        info: "border-transparent bg-[var(--color-info)]/15 text-[var(--color-info)]",
        outline:
          "border-[var(--color-border)] text-[var(--color-muted-foreground)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  function Badge({ className, variant, ...props }, ref) {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    );
  },
);
