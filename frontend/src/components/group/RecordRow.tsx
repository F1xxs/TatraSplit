import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/format";
import { ReactNode, MouseEvent } from "react";

interface RecordRowProps {
  icon: ReactNode;
  name: string;
  sub?: string;
  badge?: ReactNode;
  amount?: number;
  amountColor?: string;
  amountPrefix?: string;
  amountSub?: string;
  amountSubColor?: string;
  currency?: string;
  onClick?: () => void;
  onEdit?: () => void;
  className?: string;
}

export const RecordRow: React.FC<RecordRowProps> = ({
  icon,
  name,
  sub,
  badge,
  amount,
  amountColor,
  amountPrefix = "",
  amountSub,
  amountSubColor,
  currency = "EUR",
  onClick,
  onEdit,
  className,
}) => {
  const handleEditClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onEdit?.();
  };

  const body = (
    <>
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium truncate">{name}</span>
          {badge}
        </div>
        {sub && (
          <div className="text-xs text-[var(--color-muted-foreground)] mt-0.5 truncate">
            {sub}
          </div>
        )}
      </div>
      <div className="shrink-0 text-right">
        {amount != null && (
          <div
            className="text-sm font-semibold tabular-nums"
            style={amountColor ? { color: amountColor } : undefined}
          >
            {amountPrefix}
            {formatMoney(amount, currency)}
          </div>
        )}
        {amountSub && (
          <div
            className="text-[10px] mt-0.5 tabular-nums"
            style={{ color: amountSubColor }}
          >
            {amountSub}
          </div>
        )}
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={handleEditClick}
          className="cursor-pointer p-1.5 rounded-lg border border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)] hover:text-[var(--color-foreground)] active:scale-95 transition-all shrink-0"
          aria-label="Edit"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      )}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-4 py-3.5 w-full text-left hover:bg-[var(--color-card-elevated)] transition-colors",
          className,
        )}
      >
        {body}
      </button>
    );
  }
  return (
    <div className={cn("flex items-center gap-3 px-4 py-3.5", className)}>
      {body}
    </div>
  );
};
