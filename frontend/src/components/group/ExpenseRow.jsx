import { CategoryIcon } from "@/components/shared/CategoryIcon";
import { formatMoney } from "@/lib/format";
import { computeShare } from "@/lib/split";
import { RecordRow } from "./RecordRow";

export function ExpenseRow({
  expense,
  me,
  members = [],
  currency = "EUR",
  onEdit,
}) {
  const paidByMe = me && expense.paid_by === me.id;
  const myShare = me
    ? computeShare(expense.split, expense.amount_cents, me.id)
    : 0;
  const myImpact = paidByMe
    ? expense.amount_cents - myShare
    : me
      ? -myShare
      : 0;
  const payer = members.find((m) => m.id === expense.paid_by);

  const amountSub =
    myImpact !== 0 && me
      ? myImpact > 0
        ? `+${formatMoney(myImpact, currency)}`
        : `−${formatMoney(Math.abs(myImpact), currency)}`
      : undefined;

  return (
    <RecordRow
      icon={<CategoryIcon category={expense.category} />}
      name={expense.description}
      sub={paidByMe ? "You paid" : `${payer?.display_name || "Someone"} paid`}
      amount={expense.amount_cents}
      amountSub={amountSub}
      amountSubColor={myImpact > 0 ? "#1DB954" : "#E84040"}
      currency={currency}
      onEdit={onEdit}
    />
  );
}
