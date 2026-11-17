"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import type { MonthClosePreviewResponse } from "@repo/shared";
import { formatMoney } from "../../lib/format";
import { UserAvatar } from "./UserAvatar";

export type CarryChoice = {
  /** false: nobody's balance moves into the new month. */
  enabled: boolean;
  /** Members unticked by the manager (e.g. settled in cash). */
  excluded: Set<string>;
};

/**
 * The review step of "Close & start new month": every member's final
 * balance, with the manager's choice of what carries into the next month.
 */
export function MonthCloseReview({
  preview,
  choice,
  onChange,
  disabled,
}: {
  preview: MonthClosePreviewResponse;
  choice: CarryChoice;
  onChange: (next: CarryChoice) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("pages.settings");
  const withBalance = preview.members.filter((m) => m.final_balance !== 0);
  const settledCount = preview.members.length - withBalance.length;
  const carriedCount = choice.enabled
    ? withBalance.filter((m) => !choice.excluded.has(m.member_id)).length
    : 0;

  const toggleMember = (memberId: string) => {
    const excluded = new Set(choice.excluded);
    if (excluded.has(memberId)) excluded.delete(memberId);
    else excluded.add(memberId);
    onChange({ ...choice, excluded });
  };

  return (
    <div className="space-y-3">
      {preview.pending_bazaar_count > 0 && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-accent-warm/30 bg-accent-warm/10 px-3 py-2 text-sm text-foreground"
        >
          <AlertTriangle
            size={16}
            className="mt-0.5 shrink-0 text-accent-warm"
            aria-hidden
          />
          {t("pendingBazaarWarning", { count: preview.pending_bazaar_count })}
        </p>
      )}

      <div className="rounded-xl border border-border">
        <label className="flex cursor-pointer items-start gap-3 border-b border-border p-3">
          <input
            type="checkbox"
            checked={choice.enabled}
            onChange={(e) => onChange({ ...choice, enabled: e.target.checked })}
            disabled={disabled}
            className="mt-0.5 size-4 shrink-0 accent-[var(--color-primary)]"
          />
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-foreground">
              {t("carryTitle")}
            </span>
            <span className="block text-xs text-foreground-muted">
              {choice.enabled ? t("carryDesc") : t("carryOffDesc")}
            </span>
          </span>
        </label>

        {withBalance.length === 0 ? (
          <p className="p-3 text-sm text-foreground-muted">
            {t("nothingToCarry")}
          </p>
        ) : (
          <ul
            className={`max-h-64 divide-y divide-border overflow-y-auto ${
              choice.enabled ? "" : "opacity-50"
            }`}
          >
            {withBalance.map((m) => {
              const advance = m.final_balance > 0;
              const checked =
                choice.enabled && !choice.excluded.has(m.member_id);
              return (
                <li key={m.member_id}>
                  <label className="flex cursor-pointer items-center gap-3 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMember(m.member_id)}
                      disabled={disabled || !choice.enabled}
                      aria-label={t("carryMember", { name: m.user.name })}
                      className="size-4 shrink-0 accent-[var(--color-primary)]"
                    />
                    <UserAvatar
                      name={m.user.name}
                      avatar={m.user.avatar}
                      className="size-7 text-[11px]"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                      {m.user.name}
                    </span>
                    <span className="text-right">
                      <span
                        className={`block text-sm font-semibold tabular-nums ${
                          advance ? "text-success" : "text-destructive"
                        }`}
                      >
                        {formatMoney(Math.abs(m.final_balance))}
                      </span>
                      <span className="block text-[11px] text-foreground-muted">
                        {advance ? t("advance") : t("due")}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="text-xs text-foreground-muted">
        {t("carrySummary", {
          carried: carriedCount,
          total: withBalance.length,
        })}
        {settledCount > 0 && <> {t("settledCount", { count: settledCount })}</>}{" "}
        {t("summaryKept")}
      </p>
    </div>
  );
}
