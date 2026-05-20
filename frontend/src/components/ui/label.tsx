import { cn } from "@/lib/utils";
import React, { LabelHTMLAttributes } from "react";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  function Label({ className, ...props }, ref) {
    return (
      <label
        ref={ref}
        className={cn(
          "text-xs font-medium text-[var(--color-muted-foreground)] uppercase tracking-wider",
          className,
        )}
        {...props}
      />
    );
  },
);
