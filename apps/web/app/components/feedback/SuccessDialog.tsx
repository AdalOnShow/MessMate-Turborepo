"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckCircle2, LayoutDashboard } from "lucide-react";
import { Sheet } from "../ui/sheet";

export interface SuccessSummary {
  /** Key under feedback.successDialog.titles */
  title: "depositAdded" | "expenseAdded" | "bazaarSubmitted" | "mealsSaved";
  /** What was saved, so a mistake is easy to spot. */
  rows: { label: string; value: string }[];
  hint?: string;
}

/**
 * Shown after adding a deposit, expense or bazaar, or saving meals, in place
 * of a toast: a summary of what was saved, and a choice between going to the
 * dashboard and staying to add more.
 */
export function SuccessDialog({
  summary,
  onClose,
}: {
  summary: SuccessSummary | null;
  onClose: () => void;
}) {
  const t = useTranslations("feedback.successDialog");
  if (!summary) return null;

  return (
    <Sheet onClose={onClose} size="sm">
      <div className="flex flex-col items-center text-center">
        <span className="flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 size={30} aria-hidden="true" />
        </span>
        <h2 className="mt-3 font-heading text-xl font-bold text-foreground">
          {t(`titles.${summary.title}`)}
        </h2>
      </div>

      {summary.rows.length > 0 && (
        <dl className="mt-5 divide-y divide-border rounded-xl border border-border bg-surface-raised/50 text-sm">
          {summary.rows.map((row) => (
            <div
              key={row.label}
              className="flex items-start justify-between gap-4 px-4 py-2.5"
            >
              <dt className="shrink-0 text-foreground-muted">{row.label}</dt>
              <dd className="min-w-0 text-right font-semibold break-words text-foreground">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {summary.hint && (
        <p className="mt-3 text-center text-xs leading-relaxed text-foreground-muted">
          {summary.hint}
        </p>
      )}

      <div className="mt-6 flex shrink-0 flex-col gap-2.5 sm:flex-row-reverse">
        <Link
          href="/dashboard"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary sm:flex-1 px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          <LayoutDashboard size={16} aria-hidden="true" />
          {t("goDashboard")}
        </Link>
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-xl border sm:flex-1 border-border-strong bg-surface px-5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-raised"
        >
          {t("stayHere")}
        </button>
      </div>
    </Sheet>
  );
}
