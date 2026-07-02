"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSessionStore } from "../../../store";
import { useGetMyMess } from "../../../hooks/use-messes";
import {
  useMembers,
  useRemoveMember,
  useUpdateMemberRole,
  type MemberData,
  type MemberFilters,
} from "../../../hooks/use-members";
import { useInviteUser } from "../../../hooks/use-invites";
import { MemberFiltersBar } from "./MemberFiltersBar";
import { MembersTable } from "./MembersTable";
import { MembersDialogs } from "./MembersDialogs";
import { MembersFeedback } from "./MembersFeedback";

export function MembersContent() {
  const { user, isAuthenticated } = useSessionStore();
  const { data: myMess, isLoading: messLoading } =
    useGetMyMess(isAuthenticated);

  const [filters, setFilters] = useState<MemberFilters>({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [roleDialogMember, setRoleDialogMember] = useState<MemberData | null>(
    null,
  );
  const [removeDialogMember, setRemoveDialogMember] =
    useState<MemberData | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messId = myMess?.id;
  const isManager = myMess?.current_user_role === "MANAGER";

  const { data: members = [], isLoading: membersLoading } = useMembers(
    messId,
    filters,
  );

  const inviteUser = useInviteUser();
  const removeMember = useRemoveMember(messId ?? "");
  const updateMemberRole = useUpdateMemberRole(messId ?? "");

  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({
      ...prev,
      search: value || undefined,
    }));
  }, []);

  const handleFilterChange = useCallback(
    (updates: Partial<Pick<MemberFilters, "role" | "status">>) => {
      setFilters((prev) => ({ ...prev, ...updates }));
    },
    [],
  );

  useEffect(() => {
    if (!successMessage && !errorMessage) return;
    const timer = setTimeout(() => {
      setSuccessMessage(null);
      setErrorMessage(null);
    }, 3000);
    return () => clearTimeout(timer);
  }, [successMessage, errorMessage]);

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            Members
          </p>
          <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
            Mess Members
          </h1>
        </div>
        {isManager && (
          <div className="flex gap-3 self-start">
            <button
              type="button"
              onClick={() => setAddDialogOpen(true)}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Invite Member
            </button>
            <Link
              href="/dashboard/members/create-account"
              className="rounded-lg border border-foreground-muted/20 px-4 py-2.5 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-raised"
            >
              Create Member
            </Link>
          </div>
        )}
      </div>

      <MembersFeedback
        successMessage={successMessage}
        errorMessage={errorMessage}
      />

      {messLoading || membersLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-surface" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <div className="space-y-4">
          {isManager && (
            <>
              <MemberFiltersBar
                onSearchChange={handleSearchChange}
                filters={filters}
                onFilterChange={handleFilterChange}
              />
              <div className="rounded-xl border border-foreground-muted/15 bg-surface p-8 text-center sm:p-12">
                <p className="text-lg font-semibold text-foreground">
                  No members found
                </p>
                <p className="mt-2 text-sm text-foreground-muted">
                  {filters.search || filters.role || filters.status
                    ? "No members match your filters. Try adjusting your search."
                    : "Add members to your mess to get started."}
                </p>
                <div className="mt-4 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAddDialogOpen(true)}
                    className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                  >
                    Invite Member
                  </button>
                  <Link
                    href="/dashboard/members/create-account"
                    className="rounded-lg border border-foreground-muted/20 px-4 py-2.5 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-raised"
                  >
                    Create Member
                  </Link>
                </div>
              </div>
            </>
          )}

          {!isManager && (
            <div className="rounded-xl border border-foreground-muted/15 bg-surface p-8 text-center sm:p-12">
              <p className="text-lg font-semibold text-foreground">
                No members found
              </p>
              <p className="mt-2 text-sm text-foreground-muted">
                No members in this mess yet.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <MemberFiltersBar
            onSearchChange={handleSearchChange}
            filters={filters}
            onFilterChange={handleFilterChange}
          />

          <MembersTable
            members={members}
            isManager={isManager}
            currentUserId={user?.id}
            onRoleClick={setRoleDialogMember}
            onRemoveClick={setRemoveDialogMember}
          />
        </div>
      )}

      <MembersDialogs
        addDialogOpen={addDialogOpen}
        onInviteMember={(email) =>
          inviteUser.mutate(email, {
            onSuccess: () => {
              setAddDialogOpen(false);
              setSuccessMessage("Invite sent successfully");
            },
            onError: () => {
              setErrorMessage("Failed to send invite. Please try again.");
            },
          })
        }
        inviteMemberPending={inviteUser.isPending}
        onCloseAddDialog={() => setAddDialogOpen(false)}
        roleDialogMember={roleDialogMember}
        managerCount={
          members.filter((m) => m.mess_role === "MANAGER" && !m.removed_at)
            .length
        }
        onConfirmRole={(role) =>
          updateMemberRole.mutate(
            { userId: roleDialogMember!.user_id, role },
            {
              onSuccess: () => {
                setRoleDialogMember(null);
                setSuccessMessage("Member role updated successfully");
              },
              onError: () => {
                setErrorMessage("Failed to update role. Please try again.");
              },
            },
          )
        }
        updateRolePending={updateMemberRole.isPending}
        onCloseRoleDialog={() => setRoleDialogMember(null)}
        removeDialogMember={removeDialogMember}
        onConfirmRemove={() =>
          removeMember.mutate(removeDialogMember!.user_id, {
            onSuccess: () => {
              setRemoveDialogMember(null);
              setSuccessMessage("Member removed successfully");
            },
            onError: () => {
              setErrorMessage("Failed to remove member. Please try again.");
            },
          })
        }
        removeMemberPending={removeMember.isPending}
        onCloseRemoveDialog={() => setRemoveDialogMember(null)}
      />
    </>
  );
}
