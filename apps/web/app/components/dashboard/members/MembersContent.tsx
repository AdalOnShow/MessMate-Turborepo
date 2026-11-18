"use client";

import { useTranslations } from "next-intl";
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
import { MemberCards, type MemberCardItem } from "./MemberCards";
import { MembersDialogs } from "./MembersDialogs";
import {
  QueriesErrorState,
  failedQueries,
} from "../../feedback/QueryErrorState";

export function MembersContent() {
  const t = useTranslations("members.membersContent");
  const { user, isAuthenticated } = useSessionStore();
  const messQuery = useGetMyMess(isAuthenticated);
  const { data: myMess, isLoading: messLoading } = messQuery;

  // Removed members stay listed under the "Removed" filter only.
  const [filters, setFilters] = useState<MemberFilters>({ status: "ACTIVE" });
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [roleDialogMember, setRoleDialogMember] = useState<MemberData | null>(
    null,
  );
  const [removeDialogMember, setRemoveDialogMember] =
    useState<MemberData | null>(null);

  const messId = myMess?.id;
  const isManager = myMess?.current_user_role === "MANAGER";

  const membersQuery = useMembers(messId, filters);
  const { data: members = [], isPending: membersPending } = membersQuery;

  // Unfiltered active list for the 2-manager rule (same query as the
  // default view, so usually no extra request).
  const activeMembersQuery = useMembers(messId, { status: "ACTIVE" });

  const calcQuery = useMemberCalculations(messId);
  const { data: calculations, isPending: calcPending } = calcQuery;
  const pageQueries = [messQuery, membersQuery, calcQuery];

  // Cards come from the members list: it is filtered by the API (search,
  // role, status) and includes members the calculations leave out (removed
  // members, and everyone before the first month starts). Role and removal
  // status come from it too. Balances are joined in from the calculations.
  const cardItems = useMemo<MemberCardItem[]>(() => {
    const calcByMember = new Map(
      (calculations?.items ?? []).map((c) => [c.member_id, c]),
    );
    return members.map((m) => {
      const calc = calcByMember.get(m.id);
      const identity = {
        member_id: m.id,
        user_id: m.user_id,
        mess_role: m.mess_role,
        removed_at: m.removed_at,
        user: m.user,
      };
      if (calc && !m.removed_at) {
        return { ...calc, ...identity, has_balances: true };
      }
      return {
        ...identity,
        total_meals: 0,
        meal_cost: 0,
        shared_cost: 0,
        individual_cost: 0,
        deposit_amount: 0,
        final_bill: 0,
        final_balance: 0,
        previous_balance: 0,
        current_balance: 0,
        has_balances: false,
      };
    });
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
          <p className="label-mono text-primary">{t("members")}</p>
          <h1 className="mt-2 heading-tight text-2xl text-foreground sm:text-3xl">
            {t("messMembers")}
          </h1>
        </div>
        {isManager && (
          <div className="flex gap-3 self-start">
            <button
              type="button"
              onClick={() => setAddDialogOpen(true)}
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              {t("inviteMember")}
            </button>
            <Link
              href="/dashboard/members/create-account"
              className="rounded-lg border border-border-strong px-4 py-2.5 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-raised"
            >
              {t("createMember")}
            </Link>
          </div>
        )}
      </div>

      {messLoading ||
      (!!messId && (membersPending || calcPending) && !membersQuery.isError) ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-surface" />
          ))}
        </div>
      ) : failedQueries(...pageQueries).length > 0 ? (
        <QueriesErrorState queries={pageQueries} resource="members" />
      ) : (
        <div className="space-y-4">
          <MemberFiltersBar
            onSearchChange={handleSearchChange}
            filters={filters}
            onFilterChange={handleFilterChange}
          />

          {members.length === 0 ? (
            <div className="rounded-xl border border-border bg-surface p-8 text-center sm:p-12">
              <p className="text-lg font-semibold text-foreground">
                {t("noMembersFound")}
              </p>
              <p className="mt-2 text-sm text-foreground-muted">
                {filters.search || filters.role || filters.status === "REMOVED"
                  ? t("noMembersMatchFilters")
                  : isManager
                    ? t("addMembersMessGet")
                    : t("noMembersMessYet")}
              </p>
              {isManager && (
                <div className="mt-4 flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAddDialogOpen(true)}
                    className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                  >
                    {t("inviteMember")}
                  </button>
                  <Link
                    href="/dashboard/members/create-account"
                    className="rounded-lg border border-border-strong px-4 py-2.5 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-raised"
                  >
                    {t("createMember")}
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <MemberCards
              items={cardItems}
              monthId={calculations?.month_id || undefined}
              monthTitle={calculations?.month_title}
              isManager={isManager}
              currentUserId={user?.id}
              onRoleClick={setRoleDialogMember}
              onRemoveClick={setRemoveDialogMember}
            />
          )}
        </div>
      )}

      <MembersDialogs
        addDialogOpen={addDialogOpen}
        onInviteMember={(userId) =>
          inviteUser.mutate(userId, {
            onSuccess: () => {
              setAddDialogOpen(false);
            },
          })
        }
        inviteMemberPending={inviteUser.isPending}
        onCloseAddDialog={() => setAddDialogOpen(false)}
        roleDialogMember={roleDialogMember}
        managerCount={
          (activeMembersQuery.data ?? []).filter(
            (m) => m.mess_role === "MANAGER",
          ).length
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
