"use client";

import type { MemberData } from "../../../hooks/use-members";
import { AddMemberDialog } from "./AddMemberDialog";
import { RemoveMemberDialog } from "./RemoveMemberDialog";

export function MembersDialogs({
  addDialogOpen,
  onInviteMember,
  inviteMemberPending,
  onCloseAddDialog,
  removeDialogMember,
  onConfirmRemove,
  removeMemberPending,
  onCloseRemoveDialog,
}: {
  addDialogOpen: boolean;
  onInviteMember: (userId: string) => void;
  inviteMemberPending: boolean;
  onCloseAddDialog: () => void;
  removeDialogMember: MemberData | null;
  onConfirmRemove: () => void;
  removeMemberPending: boolean;
  onCloseRemoveDialog: () => void;
}) {
  return (
    <>
      {addDialogOpen && (
        <AddMemberDialog
          onClose={onCloseAddDialog}
          onInvite={onInviteMember}
          isPending={inviteMemberPending}
        />
      )}

      {removeDialogMember && (
        <RemoveMemberDialog
          member={removeDialogMember}
          onClose={onCloseRemoveDialog}
          onConfirm={onConfirmRemove}
          isPending={removeMemberPending}
        />
      )}
    </>
  );
}
