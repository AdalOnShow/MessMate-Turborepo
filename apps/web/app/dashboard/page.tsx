"use client";

import Link from "next/link";
import { useSessionStore } from "../store";
import { useGetMyMess } from "../hooks/use-messes";
import {
  usePendingInvites,
  useAcceptInvite,
  useRejectInvite,
} from "../hooks/use-invites";

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
  const { data: myMess, isLoading: messLoading } =
    useGetMyMess(isAuthenticated);

  return (
    <>
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-bold text-foreground">
          Welcome back{user?.name ? `, ${user.name}` : ""}
        </h1>
      </div>

      <InviteBanner />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-foreground-muted/15 bg-surface p-6">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            User Profile
          </h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-foreground-muted">Name</dt>
              <dd className="font-medium text-foreground">{user?.name}</dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Email</dt>
              <dd className="font-medium text-foreground">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-foreground-muted">Phone</dt>
              <dd className="font-medium text-foreground">
                {user?.phone || "Not added"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border border-foreground-muted/15 bg-surface p-6">
          <h2 className="mb-4 text-xl font-semibold text-foreground">
            Quick Actions
          </h2>

          {messLoading ? (
            <p className="text-sm text-foreground-muted">Loading...</p>
          ) : myMess ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-primary">
                  Current Mess
                </p>
                <p className="mt-1 font-semibold text-foreground">
                  {myMess.name}
                </p>
                <p className="mt-0.5 text-xs text-foreground-muted">
                  You are a manager
                </p>
              </div>
              <ul className="space-y-2 text-sm text-foreground-muted">
                <li>Manage meals</li>
                <li>Check balances</li>
                <li>View reports</li>
                <li>Manage members</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-foreground-muted">
                Create a mess to get started.
              </p>
              <Link
                href="/dashboard/create-mess"
                className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                Create Mess
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

