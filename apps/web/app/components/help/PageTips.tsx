"use client";

import { useState } from "react";
import Link from "next/link";
import { useMessages, useTranslations } from "next-intl";
import { BookOpen, Lightbulb } from "lucide-react";
import { useGetMyMess } from "../../hooks/use-messes";
import { useTipsStore } from "../../store/tips";
import { cn } from "../../lib/utils";
import { Sheet } from "../ui/sheet";

export type TipsPage =
  | "dashboard"
  | "members"
  | "meals"
  | "bazaar"
  | "expenses"
  | "deposits"
  | "reports"
  | "months"
  | "activity"
  | "settings"
  | "createAccount";

/**
 * Which tips are only for managers or only for members, and which part of
 * /guide explains the page in full. Tip text is in messages/tips.json.
 */
const PAGE_CONFIG: Record<
  TipsPage,
  { managerOnly?: string[]; memberOnly?: string[]; guide: string }
> = {
  dashboard: { managerOnly: ["approvals"], guide: "" },
  members: {
    managerOnly: ["invite", "create", "role", "remove"],
    guide: "guide-addMembers",
  },
  meals: {
    managerOnly: ["count", "everyone", "save", "types"],
    memberOnly: ["member"],
    guide: "guide-dailyMeals",
  },
  bazaar: { managerOnly: ["approve"], guide: "guide-approveBazaar" },
  expenses: { guide: "guide-expenses" },
  deposits: { guide: "guide-deposits" },
  reports: { managerOnly: ["edit"], guide: "guide-fixMistakes" },
  months: { managerOnly: ["start", "close"], guide: "guide-closeMonth" },
  activity: { guide: "guide-myBalance" },
  settings: { guide: "guide-manageMess" },
  createAccount: { guide: "guide-addMembers" },
};

type TipText = { title: string; body: string };

/**
 * A small "Tips" button for a page header. It opens a sheet explaining how
 * the page works, so the help is there when wanted without cluttering the
 * screen. Hidden when the user turned tips off in Profile.
 */
export function PageTips({
  page,
  className,
}: {
  page: TipsPage;
  className?: string;
}) {
  const t = useTranslations("tips");
  const enabled = useTipsStore((s) => s.enabled);
  const messages = useMessages() as unknown as {
    tips: { pages: Record<TipsPage, { items: Record<string, TipText> }> };
  };
  const { data: myMess } = useGetMyMess();
  const [open, setOpen] = useState(false);

  if (!enabled) return null;

  const isManager = myMess?.current_user_role === "MANAGER";
  const config = PAGE_CONFIG[page];
  const items = Object.entries(messages.tips.pages[page].items).filter(
    ([key]) =>
      isManager
        ? !config.memberOnly?.includes(key)
        : !config.managerOnly?.includes(key),
  );
  const pageName = t(`pages.${page}.name`);
  const guideHref = `/guide${isManager ? "" : "?role=member"}${
    config.guide ? `#${config.guide}` : ""
  }`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("buttonLabel")}
        aria-haspopup="dialog"
        className={cn(
          "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-accent-warm/30 bg-accent-warm/10 px-3 text-xs font-semibold text-accent-warm transition-colors hover:bg-accent-warm/20",
          className,
        )}
      >
        <Lightbulb size={15} aria-hidden="true" />
        {t("button")}
      </button>

      {open && (
        <Sheet
          onClose={() => setOpen(false)}
          title={t("sheetTitle", { page: pageName })}
        >
          <ol className="space-y-3">
            {items.map(([key, tip], i) => (
              <li
                key={key}
                className="flex gap-3 rounded-xl border border-border bg-surface-raised/60 p-3"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-warm/15 text-xs font-bold text-accent-warm">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {tip.title}
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-foreground-muted">
                    {tip.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <Link
              href={guideHref}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              <BookOpen size={15} aria-hidden="true" />
              {t("fullGuide")}
            </Link>
            <Link
              href="/dashboard/profile#preferences"
              onClick={() => setOpen(false)}
              className="text-xs text-foreground-muted hover:text-foreground"
            >
              {t("turnOff")}
            </Link>
          </div>
        </Sheet>
      )}
    </>
  );
}

/** The on/off switch for tips, shown in Profile. */
export function TipsPreference() {
  const t = useTranslations("tips.pref");
  const enabled = useTipsStore((s) => s.enabled);
  const setEnabled = useTipsStore((s) => s.setEnabled);

  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span className="min-w-0">
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Lightbulb
            size={16}
            className="text-accent-warm"
            aria-hidden="true"
          />
          {t("tipsLabel")}
        </span>
        <span className="mt-1 block text-sm text-foreground-muted">
          {t("tipsDesc")}
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => setEnabled(!enabled)}
        className={cn(
          "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          enabled ? "bg-primary" : "bg-border-strong",
        )}
      >
        <span
          className={cn(
            "inline-block size-5 rounded-full bg-white shadow transition-transform",
            enabled ? "translate-x-[22px]" : "translate-x-0.5",
          )}
        />
      </button>
    </label>
  );
}
