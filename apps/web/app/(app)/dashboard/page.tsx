"use client";

import { SetPasswordNotice } from "../../components/dashboard/home/SetPasswordNotice";
import { PageTips } from "../../components/help/PageTips";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSessionStore } from "../../store";
import { useGetMyMess } from "../../hooks/use-messes";
import { useGetActiveMonth } from "../../hooks/use-months";
import { useMemberDashboard, useMessDashboard } from "../../hooks/use-members";
import { useGetMonthMealSummary } from "../../hooks/use-meals";
import {
  usePendingInvites,
  useAcceptInvite,
  useRejectInvite,
} from "../../hooks/use-invites";
import { QueryErrorState } from "../../components/feedback/QueryErrorState";
import { Skeleton } from "../../components/ui/skeleton";
import { MonthPill } from "../../components/dashboard/home/MonthPill";
import {
  MessBalanceHero,
  MyBalanceHero,
} from "../../components/dashboard/home/BalanceHero";
import { StatTiles } from "../../components/dashboard/home/StatTiles";
import { QuickActions } from "../../components/dashboard/home/QuickActions";
import { BazaarApprovals } from "../../components/dashboard/home/BazaarApprovals";
import { MealsByMember } from "../../components/dashboard/home/MealsByMember";
import { MySummary } from "../../components/dashboard/home/MySummary";
import { NoMonthNotice } from "../../components/dashboard/home/NoMonthNotice";
import { RecentActivity } from "../../components/dashboard/home/RecentActivity";

function InviteBanner() {
  const t = useTranslations("pages.home");
  const { data: invites } = usePendingInvites();
  const accept = useAcceptInvite();
  const reject = useRejectInvite();

  if (!invites || invites.length === 0) return null;

  return (
    <div className="mb-5 space-y-3">
      {invites.map((invite) => (
        <div
          key={invite.id}
          className="rounded-2xl border border-primary/30 bg-primary/10 p-4"
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

function useGreeting() {
  const t = useTranslations("dashboard.home");
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return t("goodMorning");
  if (hour >= 12 && hour < 17) return t("goodAfternoon");
  return t("goodEvening");
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
      <div className="space-y-4 lg:col-span-2 lg:space-y-5">
        <Skeleton className="h-52 rounded-3xl" />
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          <Skeleton className="h-[72px] rounded-2xl" />
          <Skeleton className="h-[72px] rounded-2xl" />
          <Skeleton className="h-[72px] rounded-2xl" />
        </div>
      </div>
      <div className="space-y-4 lg:space-y-5">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    </div>
  );
}

/**
 * The home dashboard. On phones every block stacks in one column (the
 * `order-*` classes set the reading order); from `lg` the blocks split into a
 * wide main column and a narrow side column.
 */
function MessDashboardView({
  messId,
  isManager,
}: {
  messId: string;
  isManager: boolean;
}) {
  const monthQuery = useGetActiveMonth(messId);
  const month = monthQuery.data;
  const messDashboard = useMessDashboard(isManager ? messId : undefined);
  const memberDashboard = useMemberDashboard(messId);
  const mealSummary = useGetMonthMealSummary(messId, month?.id);

  if (monthQuery.isPending) return <DashboardSkeleton />;

  // If we can't tell whether a month is open, say so instead of "no month".
  if (monthQuery.isError && !month) {
    return (
      <QueryErrorState
        error={monthQuery.error}
        onRetry={monthQuery.refetch}
        isRetrying={monthQuery.isFetching}
        resource="this month"
      />
    );
  }

  if (!month) {
    return (
      <div className="flex flex-col gap-4 lg:gap-5">
        <NoMonthNotice isManager={isManager} />
        <QuickActions isManager={isManager} />
        <RecentActivity messId={messId} />
      </div>
    );
  }

  const statsSource = isManager ? messDashboard.data : memberDashboard.data;
  const stats = (
    <StatTiles
      mine={!isManager}
      meals={statsSource?.total_meals}
      mealRate={statsSource?.meal_rate}
      days={mealSummary.data?.active_days}
      loading={
        (isManager ? messDashboard.isPending : memberDashboard.isPending) ||
        mealSummary.isPending
      }
    />
  );

  return (
    <div className="flex flex-col gap-4 lg:grid lg:grid-cols-3 lg:items-start lg:gap-5">
      {/* Main column (desktop) */}
      <div className="contents lg:col-span-2 lg:flex lg:flex-col lg:gap-5">
        <div className="order-1 lg:order-none">
          {isManager ? (
            <MessBalanceHero query={messDashboard} />
          ) : (
            <MyBalanceHero query={memberDashboard} />
          )}
        </div>
        <div className="order-2 lg:order-none">{stats}</div>
        {isManager ? (
          <div className="order-4 empty:hidden lg:order-none">
            <BazaarApprovals messId={messId} monthId={month.id} />
          </div>
        ) : null}
        <div className="order-7 lg:order-none">
          <RecentActivity messId={messId} />
        </div>
      </div>

      {/* Side column (desktop) */}
      <div className="contents lg:flex lg:flex-col lg:gap-5">
        <div className="order-3 lg:order-none">
          <QuickActions isManager={isManager} />
        </div>
        <div className="order-5 lg:order-none">
          <MySummary query={memberDashboard} withBalance={isManager} />
        </div>
        <div className="order-6 lg:order-none">
          <MealsByMember query={mealSummary} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const t = useTranslations("pages.home");
  const greeting = useGreeting();
  const { user, isAuthenticated } = useSessionStore();
  const messQuery = useGetMyMess(isAuthenticated);
  const { data: myMess } = messQuery;
  const firstName = user?.name?.trim().split(/\s+/)[0];

  return (
    <>
      <header className="mb-5 sm:mb-7">
        <MonthPill />
        <p className="mt-4 text-sm text-foreground-muted">{greeting},</p>
        <div className="flex items-center justify-between gap-3">
          <h1 className="heading-tight min-w-0 truncate text-2xl text-foreground sm:text-3xl">
            {firstName || t("welcomeBack")}
          </h1>
          {myMess ? <PageTips page="dashboard" /> : null}
        </div>
      </header>

      <SetPasswordNotice />
      <InviteBanner />

      {messQuery.isPending ? (
        <DashboardSkeleton />
      ) : messQuery.isError && !myMess ? (
        <QueryErrorState
          error={messQuery.error}
          onRetry={messQuery.refetch}
          isRetrying={messQuery.isFetching}
          resource="your mess"
        />
      ) : myMess ? (
        <MessDashboardView
          messId={myMess.id}
          isManager={myMess.current_user_role === "MANAGER"}
        />
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
