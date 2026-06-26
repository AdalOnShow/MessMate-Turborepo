"use client";

import type { MemberData } from "../../../hooks/use-members";
import { AddMemberDialog } from "./AddMemberDialog";
import { RoleChangeDialog } from "./RoleChangeDialog";
import { RemoveMemberDialog } from "./RemoveMemberDialog";

export function MembersDialogs({
  addDialogOpen,
  onInviteMember,
  inviteMemberPending,
  onCloseAddDialog,
  roleDialogMember,
  managerCount,
  onConfirmRole,
  updateRolePending,
  onCloseRoleDialog,
  removeDialogMember,
  onConfirmRemove,
  removeMemberPending,
  onCloseRemoveDialog,
}: {
  addDialogOpen: boolean;
  onInviteMember: (email: string) => void;
  inviteMemberPending: boolean;
  onCloseAddDialog: () => void;
  roleDialogMember: MemberData | null;
  managerCount: number;
  onConfirmRole: (role: "MANAGER" | "MEMBER") => void;
  updateRolePending: boolean;
  onCloseRoleDialog: () => void;
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

      {roleDialogMember && (
        <RoleChangeDialog
          member={roleDialogMember}
          managerCount={managerCount}
          onClose={onCloseRoleDialog}
          onConfirm={onConfirmRole}
          isPending={updateRolePending}
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
