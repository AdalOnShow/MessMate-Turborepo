"use client";

import Link from "next/link";
import { useState } from "react";
import { useSessionStore } from "../store";
import { useGetMyMess } from "../hooks/use-messes";
import { useGetActiveMonth, useCreateMonth } from "../hooks/use-months";
import {
  usePendingInvites,
  useAcceptInvite,
  useRejectInvite,
} from "../hooks/use-invites";
import { Calendar, Loader2, Plus } from "lucide-react";

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

function ActiveMonthCard() {
  const { data: myMess } = useGetMyMess();
  const messId = myMess?.id;
  const isManager = myMess?.current_user_role === "MANAGER";
  const { data: activeMonth, isLoading } = useGetActiveMonth(messId);
  const createMonth = useCreateMonth(messId);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");

  const generateTitle = () => {
    const now = new Date();
    return now.toLocaleString("en-US", { month: "long", year: "numeric" });
  };

  const handleCreateMonth = () => {
    const monthTitle = title.trim() || generateTitle();
    createMonth.mutate(
      { title: monthTitle },
      {
        onSuccess: () => {
          setShowCreateForm(false);
          setTitle("");
        },
      },
    );
  };

  const handleOpenCreate = () => {
    setTitle(generateTitle());
    setShowCreateForm(true);
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-foreground-muted/15 bg-surface p-6">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (showCreateForm) {
    return (
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          {activeMonth
            ? "Close Current & Start New Month"
            : "Start New Month"}
        </h3>

        {activeMonth && (
          <div className="mb-4 rounded-lg border border-foreground-muted/15 bg-background p-3">
            <p className="text-xs text-foreground-muted">Current month</p>
            <p className="text-sm font-semibold text-foreground">
              {activeMonth.title}
            </p>
            <p className="mt-1 text-xs text-foreground-muted">
              Will be closed and archived automatically
            </p>
          </div>
        )}

        <div className="mb-4">
          <label
            htmlFor="month-title"
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            Month Title
          </label>
          <input
            id="month-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. August 2026"
            className="w-full rounded-lg border border-border bg-background px-4 py-2.5 text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
            disabled={createMonth.isPending}
          />
        </div>

        {createMonth.isError && (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3">
            <p className="text-sm text-destructive">
              {(createMonth.error as Error)?.message ||
                "Failed to create month."}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => {
              setShowCreateForm(false);
              setTitle("");
            }}
            disabled={createMonth.isPending}
            className="rounded-lg border border-foreground-muted/20 px-4 py-2 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-raised disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateMonth}
            disabled={createMonth.isPending}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {createMonth.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus size={14} />
                Create Month
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (!activeMonth) {
    return (
      <div className="rounded-xl border border-foreground-muted/15 bg-surface p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={18} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Active Month
          </h3>
        </div>
        <p className="mb-4 text-sm text-foreground-muted">
          No active month. Start a new month to begin tracking meals and
          expenses.
        </p>
        {isManager && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            <Plus size={16} />
            Start Month
          </button>
        )}
      </div>
    );
  }

  const startedDate = new Date(activeMonth.started_at).toLocaleDateString(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );

  return (
    <div className="rounded-xl border border-foreground-muted/15 bg-surface p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar size={18} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            Active Month
          </h3>
        </div>
        <span className="rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-semibold text-green-500">
          Active
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-xl font-bold text-foreground">
            {activeMonth.title}
          </p>
          <p className="text-xs text-foreground-muted">Started {startedDate}</p>
        </div>

        {isManager && (
          <button
            type="button"
            onClick={handleOpenCreate}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-foreground-muted/20 px-4 py-2.5 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-raised"
          >
            <Plus size={16} />
            Start New Month
          </button>
        )}
      </div>
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
        <ActiveMonthCard />

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
                  You are a{" "}
                  {myMess.current_user_role === "MANAGER"
                    ? "manager"
                    : "member"}
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
