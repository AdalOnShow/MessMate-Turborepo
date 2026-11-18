"use client";

import { useTranslations } from "next-intl";
import { Check, Loader2, X } from "lucide-react";
import {
  useApproveBazaar,
  useBazaarSubmissions,
  useRejectBazaar,
} from "@/app/hooks/use-bazaar";
import { formatDateOnly, formatMoney } from "@/app/lib/format";
import { QueryErrorState } from "../../feedback/QueryErrorState";
import { UserAvatar } from "../UserAvatar";
import { Card, CardTitle } from "./shared";

/**
 * Manager-only list of bazaar submissions waiting for a decision.
 * Renders nothing when there is nothing to approve, to keep the page calm.
 */
export function BazaarApprovals({
  messId,
  monthId,
}: {
  messId: string;
  monthId: string;
}) {
  const t = useTranslations("dashboard.home");
  // First page of pending only; shares its cache with the bazaar page's
  // Pending tab. The badge shows the full count from the server.
  const historyQuery = useBazaarSubmissions(messId, monthId, "PENDING");
  const approve = useApproveBazaar(messId, monthId);
  const reject = useRejectBazaar(messId, monthId);
  const pending = historyQuery.items;
  const pendingTotal = historyQuery.counts?.pending ?? pending.length;
  const busy = approve.isPending || reject.isPending;

  if (historyQuery.isError && !historyQuery.data) {
    return (
      <QueryErrorState
        compact
        error={historyQuery.error}
        onRetry={historyQuery.refetch}
        isRetrying={historyQuery.isFetching}
        resource="pending bazaars"
      />
    );
  }
  if (pending.length === 0) return null;

  return (
    <Card>
      <CardTitle
        title={t("bazaarApprovals")}
        href="/dashboard/bazaar"
        linkLabel={String(pendingTotal)}
        badge={
          <span className="size-1.5 rounded-full bg-accent-warm" aria-hidden />
        }
      />
      <ul className="-mx-1 divide-y divide-border">
        {pending.map((submission) => {
          const approving =
            approve.isPending && approve.variables === submission.id;
          const rejecting =
            reject.isPending && reject.variables === submission.id;
          return (
            <li
              key={submission.id}
              className="flex items-center gap-3 px-1 py-2.5"
            >
              <UserAvatar
                name={submission.submitter?.name}
                avatar={submission.submitter?.avatar}
                className="size-9 text-xs"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">
                  {submission.submitter?.name}
                </p>
                <p className="truncate text-xs text-foreground-muted">
                  {t("items", { count: submission.items.length })} ·{" "}
                  {formatDateOnly(submission.expense_date, {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <span className="shrink-0 text-sm font-bold text-foreground tabular-nums">
                {formatMoney(submission.total_amount)}
              </span>
              <div className="flex shrink-0 gap-1.5">
                <button
                  type="button"
                  onClick={() => reject.mutate(submission.id)}
                  disabled={busy}
                  aria-label={t("reject")}
                  title={t("reject")}
                  className="flex size-9 items-center justify-center rounded-full border border-border text-foreground-muted transition-colors hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  {rejecting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <X size={16} />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => approve.mutate(submission.id)}
                  disabled={busy}
                  aria-label={t("approve")}
                  title={t("approve")}
                  className="flex size-9 items-center justify-center rounded-full bg-success text-white transition-colors hover:bg-success/90 disabled:opacity-50"
                >
                  {approving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
