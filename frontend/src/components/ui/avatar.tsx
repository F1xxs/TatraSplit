import { cn } from "@/lib/utils";
import { initials, colorForName } from "@/lib/format";
import React, { HTMLAttributes } from "react";

type SizeKey = "xs" | "sm" | "md" | "lg" | "xl";

const sizeMap: Record<SizeKey, string> = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
  xl: "h-20 w-20 text-xl",
};

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name?: string;
  src?: string;
  color?: string;
  size?: SizeKey;
  ring?: boolean;
}

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  function Avatar(
    { name, src, color, size = "md", className, ring = false, ...props },
    ref,
  ) {
    const bg = color || colorForName(name || "");
    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center rounded-full overflow-hidden font-semibold text-white shrink-0",
          sizeMap[size] || sizeMap.md,
          ring && "ring-2 ring-[var(--color-background)]",
          className,
        )}
        style={{ background: src ? undefined : bg }}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={name || ""}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{initials(name)}</span>
        )}
      </div>
    );
  },
);

interface User {
  id: string;
  display_name?: string;
  color?: string;
}

interface AvatarStackProps extends HTMLAttributes<HTMLDivElement> {
  users?: User[];
  max?: number;
  size?: SizeKey;
}

export const AvatarStack = React.forwardRef<HTMLDivElement, AvatarStackProps>(
  function AvatarStack(
    { users = [], max = 4, size = "sm", className, ...props },
    ref,
  ) {
    const shown = users.slice(0, max);
    const extra = users.length - shown.length;
    return (
      <div ref={ref} className={cn("flex items-center", className)} {...props}>
        <div className="flex -space-x-2">
          {shown.map((u) => (
            <Avatar
              key={u.id}
              name={u.display_name}
              color={u.color}
              size={size}
              ring
            />
          ))}
        </div>
        {extra > 0 && (
          <div
            className={cn("ml-1 text-xs text-[var(--color-muted-foreground)]")}
          >
            +{extra}
          </div>
        )}
      </div>
    );
  },
);
