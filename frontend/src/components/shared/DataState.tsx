import React, { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DataStateProps {
  loading?: boolean;
  error?: Error | null;
  empty?: boolean;
  emptyMessage?: string;
  emptyContent?: ReactNode;
  onRetry?: () => void;
  loadingRows?: number;
  children?: ReactNode;
}

export const DataState: React.FC<DataStateProps> = ({
  loading,
  error,
  empty,
  emptyMessage = "Nothing here yet.",
  emptyContent,
  onRetry,
  loadingRows = 3,
  children,
}) => {
  if (loading) {
    return (
      <div className="p-4 space-y-3">
        {Array.from({ length: loadingRows }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 text-center space-y-3">
        <div className="text-sm text-[var(--color-muted-foreground)]">
          {(error as any)?.message || "Failed to load."}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--color-primary)] font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        )}
      </div>
    );
  }

  if (empty) {
    if (emptyContent) return emptyContent as React.ReactElement;
    return (
      <div className="py-12 text-center text-sm text-[var(--color-muted-foreground)]">
        {emptyMessage}
      </div>
    );
  }

  return <>{children}</>;
};
