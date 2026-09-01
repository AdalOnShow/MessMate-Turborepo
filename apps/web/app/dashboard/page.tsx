"use client";

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

function InviteBanner() {
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
                You have been invited to join{" "}
                <span className="text-primary">{invite.mess_name}</span>
              </p>
              <p className="mt-1 text-xs text-foreground-muted">
                by {invite.requester_name} ({invite.requester_email})
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => accept.mutate(invite.id)}
                disabled={accept.isPending}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                {accept.isPending ? "Accepting..." : "Accept"}
              </button>
              <button
                type="button"
                onClick={() => reject.mutate(invite.id)}
                disabled={reject.isPending}
                className="rounded-lg border border-foreground-muted/20 px-3 py-1.5 text-xs font-semibold text-foreground-muted transition-colors hover:bg-surface-raised disabled:opacity-60"
              >
                {reject.isPending ? "Rejecting..." : "Reject"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { user, isAuthenticated } = useSessionStore();
  const { data: myMess } = useGetMyMess(isAuthenticated);

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Welcome back{user?.name ? `, ${user.name}` : ""}
        </h1>
      </div>

      <InviteBanner />

      {myMess ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          <MonthOverviewBento />
          <MealOverview messId={myMess.id} />
          <PendingBazaarApprovals />
          <QuickActions />
          <RecentActivity messId={myMess.id} />
        </div>
      ) : (
        <div className="rounded-2xl border border-foreground-muted/15 bg-surface p-8 text-center">
          <p className="text-lg font-semibold text-foreground">No mess yet</p>
          <p className="mt-1 text-sm text-foreground-muted">
            Create a mess to start tracking meals, deposits, and expenses.
          </p>
          <Link
            href="/dashboard/create-mess"
            className="mt-5 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Create Mess
          </Link>
        </div>
      )}
    </>
  );
}
