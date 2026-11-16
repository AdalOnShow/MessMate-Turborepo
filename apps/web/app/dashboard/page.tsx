"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSessionStore } from "../store";
import { useGetMyMess } from "../hooks/use-messes";
import {
  usePendingInvites,
  useAcceptInvite,
  useRejectInvite,
} from "../hooks/use-invites";
import { MonthOverviewBento } from "../components/dashboard/MonthOverviewBento";
import { MealOverview } from "../components/dashboard/MealOverview";
import { RecentActivity } from "../components/dashboard/RecentActivity";
import { QuickActions } from "../components/dashboard/QuickActions";
import { PendingBazaarApprovals } from "../components/dashboard/PendingBazaarApprovals";
import { MemberMonthSummary } from "../components/dashboard/MemberMonthSummary";
import { MemberQuickLinks } from "../components/dashboard/MemberQuickLinks";
import { QueryErrorState } from "../components/feedback/QueryErrorState";

function InviteBanner() {
  const t = useTranslations("pages.home");
  const { data: invites } = usePendingInvites();
  const accept = useAcceptInvite();
  const reject = useRejectInvite();

  if (!invites || invites.length === 0) return null;

  return (
    <div className="mb-6 space-y-3">
      {invites.map((invite) => (
        <div
          key={invite.id}
          className="rounded-xl border border-primary/30 bg-primary/10 p-4"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t("haveBeenInvitedJoin")}{" "}
                <span className="text-primary">{invite.mess_name}</span>
              </p>
              <p className="mt-1 text-xs text-foreground-muted">
                {t("by")} {invite.requester_name} ({invite.requester_email})
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => accept.mutate(invite.id)}
                disabled={accept.isPending}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                {accept.isPending ? t("accepting") : "Accept"}
              </button>
              <button
                type="button"
                onClick={() => reject.mutate(invite.id)}
                disabled={reject.isPending}
                className="rounded-lg border border-border-strong px-3 py-1.5 text-xs font-semibold text-foreground-muted transition-colors hover:bg-surface-raised disabled:opacity-60"
              >
                {reject.isPending ? t("rejecting") : "Reject"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const t = useTranslations("pages.home");
  const { user, isAuthenticated } = useSessionStore();
  const messQuery = useGetMyMess(isAuthenticated);
  const { data: myMess } = messQuery;

  const isManager = myMess?.current_user_role === "MANAGER";

  return (
    <>
      <div className="mb-8">
        <p className="label-mono text-primary">{t("dashboard")}</p>
        <h1 className="mt-2 heading-tight text-2xl text-foreground sm:text-3xl">
          {t("welcomeBack")}
          {user?.name ? `, ${user.name}` : ""}
        </h1>
      </div>

      <InviteBanner />

      {messQuery.isPending ? (
        <div className="grid animate-pulse grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          <div className="h-80 rounded-2xl bg-surface md:col-span-2 lg:row-span-2" />
          <div className="h-80 rounded-2xl bg-surface lg:row-span-2" />
          <div className="h-40 rounded-2xl bg-surface md:col-span-2 lg:col-span-3" />
        </div>
      ) : messQuery.isError && !myMess ? (
        <QueryErrorState
          error={messQuery.error}
          onRetry={messQuery.refetch}
          isRetrying={messQuery.isFetching}
          resource="your mess"
        />
      ) : myMess ? (
        isManager ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            <MonthOverviewBento />
            <MealOverview messId={myMess.id} />
            <PendingBazaarApprovals />
            <QuickActions />
            <RecentActivity messId={myMess.id} />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            <MonthOverviewBento />
            <MealOverview messId={myMess.id} />
            <MemberMonthSummary />
            <MemberQuickLinks />
            <RecentActivity messId={myMess.id} />
          </div>
        )
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <p className="text-lg font-semibold text-foreground">
            {t("noMessYet")}
          </p>
          <p className="mt-1 text-sm text-foreground-muted">
            {t("createMessStartTracking")}
          </p>
          <Link
            href="/dashboard/create-mess"
            className="mt-5 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            {t("createMess")}
          </Link>
        </div>
      )}
    </>
  );
}
