import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar } from "@/components/ui/avatar";
import { BalancePill } from "@/components/shared/BalancePill";
import { useAddGroupMember, useRemoveGroupMember } from "@/hooks/useMutations";
import { useToast } from "@/components/ui/toaster";

interface User {
  id: string;
  display_name: string;
  color: string;
  handle: string;
  [key: string]: any;
}

interface Member extends User {}

interface Group {
  currency?: string;
  [key: string]: any;
}

interface Balance {
  user_id: string;
  net_cents?: number;
  [key: string]: any;
}

interface Balances {
  members?: Balance[];
  [key: string]: any;
}

interface Contact {
  user: User;
  [key: string]: any;
}

interface MembersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group?: Group;
  members: Member[];
  me?: User;
  contacts: Contact[];
  balances?: Balances;
  groupId: string;
}

export const MembersSheet: React.FC<MembersSheetProps> = ({
  open,
  onOpenChange,
  group,
  members,
  me,
  contacts,
  balances,
  groupId,
}) => {
  const addMember = useAddGroupMember(groupId);
  const removeMember = useRemoveGroupMember(groupId);
  const { toast } = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const groupMemberIds = new Set(members.map((m) => m.id));
  const contactsNotInGroup = contacts
    .map((c) => c.user)
    .filter((u) => u && !groupMemberIds.has(u.id));

  const addUser = async (userId: string) => {
    setBusyId(userId);
    try {
      await addMember.mutateAsync(userId);
      toast({ variant: "success", title: "Member added" });
    } catch (err: any) {
      toast({
        variant: "error",
        title: "Could not add member",
        description: err.message,
      });
    } finally {
      setBusyId(null);
    }
  };

  const removeUser = async (userId: string) => {
    setBusyId(userId);
    try {
      await removeMember.mutateAsync(userId);
      toast({ variant: "success", title: "Member removed" });
    } catch (err: any) {
      toast({
        variant: "error",
        title: "Could not remove member",
        description: err.message,
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Members · {members.length}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-1">
            {members.map((m) => {
              const isMe = m.id === me?.id;
              const net =
                balances?.members?.find((b) => b.user_id === m.id)?.net_cents ??
                null;
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] px-3 py-2.5"
                >
                  <Avatar name={m.display_name} color={m.color} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">
                      {m.display_name}
                      {isMe && (
                        <span className="text-xs text-[var(--color-muted-foreground)] font-normal">
                          {" "}
                          (you)
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--color-muted-foreground)]">
                      {m.handle}
                    </div>
                  </div>
                  {net !== null && (
                    <BalancePill
                      cents={net}
                      currency={group?.currency || "EUR"}
                    />
                  )}
                  {!isMe && (
                    <button
                      type="button"
                      onClick={() => removeUser(m.id)}
                      disabled={busyId === m.id}
                      className="shrink-0 p-1 rounded text-[var(--color-muted-foreground)] hover:text-red-500 transition-colors"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {contactsNotInGroup.length > 0 && (
            <div>
              <div className="text-xs font-medium text-[var(--color-muted-foreground)] mb-2">
                Add from contacts
              </div>
              <div className="space-y-1">
                {contactsNotInGroup.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] px-3 py-2.5"
                  >
                    <Avatar name={u.display_name} color={u.color} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium truncate">
                        {u.display_name}
                      </div>
                      <div className="text-xs text-[var(--color-muted-foreground)]">
                        {u.handle}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addUser(u.id)}
                      disabled={busyId === u.id}
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
