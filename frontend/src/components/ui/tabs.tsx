import {
  createContext,
  useContext,
  useState,
  ReactNode,
  HTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";
import React from "react";

interface TabsContextType {
  value: string;
  setValue: (value: string) => void;
}

const TabsCtx = createContext<TabsContextType | null>(null);

interface TabsProps extends HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: ReactNode;
}

export const Tabs: React.FC<TabsProps> = ({
  value,
  defaultValue,
  onValueChange,
  className,
  children,
}) => {
  const [internal, setInternal] = useState(defaultValue || "");
  const v = value !== undefined ? value : internal;
  const setV = (nv: string) => {
    if (value === undefined) setInternal(nv);
    onValueChange?.(nv);
  };
  return (
    <TabsCtx.Provider value={{ value: v, setValue: setV }}>
      <div className={cn("flex flex-col gap-4", className)}>{children}</div>
    </TabsCtx.Provider>
  );
};

export const TabsList = React.forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(function TabsList({ className, children, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-lg bg-[var(--color-secondary)] p-1 text-[var(--color-muted-foreground)] self-start",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});

interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  TabsTriggerProps
>(function TabsTrigger({ value, className, children, ...props }, ref) {
  const ctx = useContext(TabsCtx);
  if (!ctx) throw new Error("TabsTrigger must be used within Tabs");
  const active = ctx.value === value;
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => ctx.setValue(value)}
      data-state={active ? "active" : "inactive"}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)] disabled:pointer-events-none disabled:opacity-50",
        active
          ? "bg-[var(--color-background)] text-[var(--color-foreground)] shadow-sm"
          : "hover:text-[var(--color-foreground)]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
});

interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  function TabsContent({ value, className, children, ...props }, ref) {
    const ctx = useContext(TabsCtx);
    if (!ctx) throw new Error("TabsContent must be used within Tabs");
    if (ctx.value !== value) return null;
    return (
      <div
        ref={ref}
        className={cn("focus-visible:outline-none", className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);
