import { CategoryIcon } from "@/components/shared/CategoryIcon";
import { RecordRow } from "./RecordRow";

interface Member {
    id: string;
    display_name: string;
}

interface ReceiptData {
    id: string;
    place?: string;
    metadata?: {
        total_cents?: number;
        default_payer?: string;
        default_category?: string;
        [key: string]: any;
    };
    [key: string]: any;
}

interface ReceiptRowProps {
    receipt: ReceiptData;
    currency?: string;
    members?: Member[];
    me?: { id: string };
    onEdit: () => void;
}

export const ReceiptRow: React.FC<ReceiptRowProps> = ({
    receipt,
    currency = "EUR",
    members = [],
    me,
    onEdit,
}) => {
    const defaultPayerId = receipt.metadata?.default_payer;
    const payer = defaultPayerId
        ? members.find((m) => m.id === defaultPayerId)
        : null;
    const payerLabel = payer
        ? `${payer.id === me?.id ? "You" : payer.display_name} payed`
        : undefined;
    const category = receipt.metadata?.default_category || "other";

    return (
        <RecordRow
            icon={<CategoryIcon category={category} />}
            name={receipt.place || "Receipt"}
            sub={payerLabel}
            amount={receipt.metadata?.total_cents ?? 0}
            currency={currency}
            onEdit={onEdit}
        />
    );
};
