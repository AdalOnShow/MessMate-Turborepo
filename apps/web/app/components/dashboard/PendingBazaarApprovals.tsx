"use client";

import { CheckCircle2, Loader2, ShoppingCart, XCircle } from "lucide-react";
import { useGetMyMess } from "../../hooks/use-messes";
import { useGetActiveMonth } from "../../hooks/use-months";
import {
  useGetBazaarHistory,
  useApproveBazaar,
  useRejectBazaar,
} from "../../hooks/use-bazaar";
import { formatMoney } from "../../lib/format";
import { BentoCard, CardHeading } from "./bento";

export function PendingBazaarApprovals() {
  const { data: myMess } = useGetMyMess();
  const messId = myMess?.id;
  const isManager = myMess?.current_user_role === "MANAGER";
  const { data: activeMonth } = useGetActiveMonth(messId);
  const { data: history, isLoading } = useGetBazaarHistory(
    messId,
    activeMonth?.id,
  );
  const approve = useApproveBazaar(messId, activeMonth?.id);
  const reject = useRejectBazaar(messId, activeMonth?.id);

  if (!isManager || !activeMonth) return null;

  const pending = history?.pending ?? [];

  return (
    <BentoCard className="flex flex-col p-6 lg:col-span-2">
      <CardHeading
        icon={<ShoppingCart size={15} />}
        title="Bazaar approvals"
        action={
          pending.length > 0 ? (
            <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-500">
              {pending.length} pending
            </span>
          ) : undefined
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : pending.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-foreground-muted/15 py-6">
          <p className="text-sm text-foreground-muted">
            No bazaar submissions awaiting approval.
          </p>
        </div>
      ) : (
        <div className="grid flex-1 grid-cols-1 gap-2.5 md:grid-cols-2">
          {pending.map((submission) => (
            <div
              key={submission.id}
              className="rounded-xl border border-foreground-muted/10 bg-background/40 p-4"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {submission.submitter?.name}
                  </p>
                  <p className="text-xs text-foreground-muted">
                    {submission.items.length} item
                    {submission.items.length === 1 ? "" : "s"} ·{" "}
                    {new Date(submission.expense_date).toLocaleDateString(
                      "en-US",
                      { month: "short", day: "numeric" },
                    )}
                  </p>
                </div>
                <span className="shrink-0 text-base font-bold text-foreground">
                  {formatMoney(submission.total_amount)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => approve.mutate(submission.id)}
                  disabled={approve.isPending || reject.isPending}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-success px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-success/90 disabled:opacity-60"
                >
                  {approve.isPending ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <CheckCircle2 size={12} />
                  )}
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => reject.mutate(submission.id)}
                  disabled={reject.isPending || approve.isPending}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-destructive/90 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-destructive disabled:opacity-60"
                >
                  {reject.isPending ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <XCircle size={12} />
                  )}
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </BentoCard>
  );
}
