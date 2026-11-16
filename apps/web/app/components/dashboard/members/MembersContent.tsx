"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useSessionStore } from "../../../store";
import { useGetMyMess } from "../../../hooks/use-messes";
import {
  useMembers,
  useMemberCalculations,
  useRemoveMember,
  useUpdateMemberRole,
  type MemberData,
  type MemberFilters,
} from "../../../hooks/use-members";
import { useInviteUser } from "../../../hooks/use-invites";
import { MemberFiltersBar } from "./MemberFiltersBar";
import { MemberCards } from "./MemberCards";
import { MembersDialogs } from "./MembersDialogs";
import {
  QueriesErrorState,
  failedQueries,
} from "../../feedback/QueryErrorState";

export function MembersContent() {
  const { user, isAuthenticated } = useSessionStore();
  const messQuery = useGetMyMess(isAuthenticated);
  const { data: myMess, isLoading: messLoading } = messQuery;

  const [filters, setFilters] = useState<MemberFilters>({});
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [roleDialogMember, setRoleDialogMember] = useState<MemberData | null>(
    null,
  );
  const [removeDialogMember, setRemoveDialogMember] =
    useState<MemberData | null>(null);

  const messId = myMess?.id;
  const isManager = myMess?.current_user_role === "MANAGER";

  const membersQuery = useMembers(messId, filters);
  const { data: members = [], isLoading: membersLoading } = membersQuery;

  const calcQuery = useMemberCalculations(messId);
  const { data: calculations, isLoading: calcLoading } = calcQuery;
  const pageQueries = [messQuery, membersQuery, calcQuery];

  // The cards are built from the calculations list, which the API returns
  // unfiltered, so apply the search/role/status result to it here.
  const visibleCalculations = useMemo(() => {
    if (!calculations) return calculations;
    const visibleUserIds = new Set(members.map((m) => m.user_id));
    return {
      ...calculations,
      items: calculations.items.filter((item) =>
        visibleUserIds.has(item.user_id),
      ),
    };
  }, [calculations, members]);

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

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="label-mono text-primary">Members</p>
          <h1 className="mt-2 heading-tight text-2xl text-foreground sm:text-3xl">
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
              className="rounded-lg border border-border-strong px-4 py-2.5 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-raised"
            >
              Create Member
            </Link>
          </div>
        )}
      </div>

      {messLoading || membersLoading || calcLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-surface" />
          ))}
        </div>
      ) : failedQueries(...pageQueries).length > 0 ? (
        <QueriesErrorState queries={pageQueries} resource="members" />
      ) : members.length === 0 ? (
        <div className="space-y-4">
          {isManager && (
            <>
              <MemberFiltersBar
                onSearchChange={handleSearchChange}
                filters={filters}
                onFilterChange={handleFilterChange}
              />
              <div className="rounded-xl border border-border bg-surface p-8 text-center sm:p-12">
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
                    className="rounded-lg border border-border-strong px-4 py-2.5 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-raised"
                  >
                    Create Member
                  </Link>
                </div>
              </div>
            </>
          )}

          {!isManager && (
            <div className="rounded-xl border border-border bg-surface p-8 text-center sm:p-12">
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

          <MemberCards
            data={visibleCalculations}
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
            },
          })
        }
        removeMemberPending={removeMember.isPending}
        onCloseRemoveDialog={() => setRemoveDialogMember(null)}
      />
    </>
  );
}
