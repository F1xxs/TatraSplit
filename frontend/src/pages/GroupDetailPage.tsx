import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trash2, Users } from "lucide-react";
import { GroupHeaderCard } from "@/components/group/GroupHeaderCard";
import { MembersSheet } from "@/components/group/MembersSheet";
import { TransferDialog } from "@/components/group/TransferDialog";
import { ActivityTab } from "@/components/group/tabs/ActivityTab";
import { BalancesTab } from "@/components/group/tabs/BalancesTab";
import { ExpensesTab } from "@/components/group/tabs/ExpensesTab";
import { ReceiptsTab } from "@/components/group/tabs/ReceiptsTab";
import { TransfersTab } from "@/components/group/tabs/TransfersTab";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toaster";
import { useContacts } from "@/hooks/useContacts";
import {
  useGroup,
  useGroupActivity,
  useGroupBalances,
  useGroupExpenses,
  useGroupReceipts,
  useGroupTransfers,
} from "@/hooks/useGroups";
import { useMe } from "@/hooks/useMe";
import { useDeleteGroup } from "@/hooks/useMutations";

interface TabConfig {
  value: string;
  label: string;
}

const TABS: TabConfig[] = [
  { value: "expenses", label: "Expenses" },
  { value: "receipts", label: "Receipts" },
  { value: "balances", label: "Balances" },
  { value: "transfers", label: "Transfers" },
  { value: "activity", label: "Activity" },
];

export const GroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return <div className="text-center py-8">Group not found</div>;
  }

  const navigate = useNavigate();
  const { data: group, isLoading } = useGroup(id);
  const {
    data: expenses = [],
    isLoading: expLoading,
    error: expError,
    refetch: refetchExp,
  } = useGroupExpenses(id);
  const {
    data: receipts = [],
    isLoading: recLoading,
    error: recError,
    refetch: refetchRec,
  } = useGroupReceipts(id);
  const { data: balances } = useGroupBalances(id);
  const {
    data: activity = [],
    isLoading: actLoading,
    error: actError,
    refetch: refetchAct,
  } = useGroupActivity(id);
  const {
    data: transfers = [],
    isLoading: trfLoading,
    error: trfError,
    refetch: refetchTrf,
  } = useGroupTransfers(id);
  const { data: me } = useMe();
  const { data: contacts = [] } = useContacts();
  const deleteGroup = useDeleteGroup(id);
  const { toast } = useToast();

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [editTransfer, setEditTransfer] = useState<any>(null);
  const [settleInitial, setSettleInitial] = useState<any>(null);

  const members = (group as any)?.members || [];
  const isCreator = (group as any)?.created_by === (me as any)?.id;
  const currency = (group as any)?.currency || "EUR";
  const myNet =
    (balances as any)?.members?.find((m: any) => m.user_id === (me as any)?.id)
      ?.net_cents ?? 0;

  const handleDeleteGroup = async (): Promise<void> => {
    try {
      await deleteGroup.mutateAsync();
      toast({ variant: "success", title: "Group deleted" });
      navigate("/groups");
    } catch (err: any) {
      toast({
        variant: "error",
        title: "Could not delete group",
        description: err.message,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/groups")}
          className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMembersOpen(true)}
            className="p-2 rounded-lg text-[var(--color-muted-foreground)] hover:bg-[var(--color-secondary)] transition-colors"
            aria-label="Members"
          >
            <Users className="h-4 w-4" />
          </button>
          {isCreator && (
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="p-2 rounded-lg text-[var(--color-muted-foreground)] hover:text-red-500 hover:bg-red-500/10 transition-colors"
              aria-label="Delete group"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <GroupHeaderCard
        group={group as any}
        members={members}
        currency={currency}
        myNet={myNet}
        isLoading={isLoading}
      />

      <Tabs defaultValue="expenses">
        <TabsList className="w-full rounded-none border-b border-[var(--color-border)] bg-transparent p-0 h-auto">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-1 rounded-none border-b-2 border-transparent pb-3 pt-1 text-xs font-medium text-[var(--color-muted-foreground)] data-[state=active]:border-[var(--color-primary)] data-[state=active]:text-[var(--color-foreground)] data-[state=active]:shadow-none bg-transparent"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="expenses" className="mt-4">
          <ExpensesTab
            id={id}
            expenses={expenses}
            loading={expLoading}
            error={expError}
            refetch={refetchExp}
            me={me}
            members={members}
            currency={currency}
          />
        </TabsContent>

        <TabsContent value="receipts" className="mt-4">
          <ReceiptsTab
            id={id}
            receipts={receipts}
            loading={recLoading}
            error={recError}
            refetch={refetchRec}
            currency={currency}
          />
        </TabsContent>

        <TabsContent value="balances" className="mt-4">
          <BalancesTab
            balances={balances}
            expenses={expenses}
            currency={currency}
            me={me}
            onSettle={(t) => {
              setSettleInitial(t);
              setTransferOpen(true);
            }}
          />
        </TabsContent>

        <TabsContent value="transfers" className="mt-4">
          <TransfersTab
            transfers={transfers}
            loading={trfLoading}
            error={trfError}
            refetch={refetchTrf}
            members={members}
            currency={currency}
            onAdd={() => setTransferOpen(true)}
            onEdit={setEditTransfer}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <ActivityTab
            activity={activity}
            loading={actLoading}
            error={actError}
            refetch={refetchAct}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Delete &ldquo;{(group as any)?.name}&rdquo;?
            </DialogTitle>
            <DialogDescription>
              All expenses, transfers, and activity will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDeleteGroup}
              disabled={deleteGroup.isPending}
            >
              {deleteGroup.isPending ? "Deleting…" : "Delete group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MembersSheet
        open={membersOpen}
        onOpenChange={setMembersOpen}
        group={group as any}
        members={members as any}
        me={me as any}
        contacts={contacts as any}
        balances={balances as any}
        groupId={id}
      />

      <TransferDialog
        key={
          settleInitial
            ? `${settleInitial.from_user}-${settleInitial.to_user}`
            : "new-transfer"
        }
        open={transferOpen}
        onOpenChange={(o) => {
          setTransferOpen(o);
          if (!o) setSettleInitial(null);
        }}
        initial={settleInitial}
        members={members}
        groupId={id}
        currency={currency}
        me={me}
      />

      {editTransfer && (
        <TransferDialog
          key={editTransfer.id}
          open={!!editTransfer}
          onOpenChange={(o) => {
            if (!o) setEditTransfer(null);
          }}
          initial={editTransfer}
          members={members}
          groupId={id}
          currency={currency}
          me={me}
        />
      )}
    </div>
  );
};
