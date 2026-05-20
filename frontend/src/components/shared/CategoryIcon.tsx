import React from "react";
import { cn } from "@/lib/utils";
import { getCategory } from "@/lib/format";

type CategoryIconSize = "sm" | "md" | "lg";

interface CategoryIconProps {
  category: string;
  size?: CategoryIconSize;
  className?: string;
}

const sizeMap: Record<CategoryIconSize, string> = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-lg",
  lg: "h-12 w-12 text-xl",
};

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  size = "md",
  className,
}) => {
  const c = getCategory(category);
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-xl shrink-0",
        sizeMap[size] || sizeMap.md,
        className,
      )}
      style={{ background: `color-mix(in oklab, ${c.color} 18%, transparent)` }}
    >
      <span role="img" aria-label={c.label}>
        {c.emoji}
      </span>
    </div>
  );
};
