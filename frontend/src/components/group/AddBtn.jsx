import { Plus } from "lucide-react";
import { Link } from "react-router-dom";

const cls =
  "w-full flex items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] py-2.5 text-sm font-medium hover:bg-[var(--color-card-elevated)] transition-colors";

export function AddBtn({ to, onClick, children }) {
  if (to)
    return (
      <Link to={to} className={cls}>
        <Plus className="h-4 w-4" />
        {children}
      </Link>
    );
  return (
    <button type="button" onClick={onClick} className={cls}>
      <Plus className="h-4 w-4" />
      {children}
    </button>
  );
}
