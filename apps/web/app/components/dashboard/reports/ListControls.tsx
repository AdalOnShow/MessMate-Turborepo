"use client";

import { useTranslations } from "next-intl";
import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "../../ui/button";

/** Filter chips with a count each, e.g. "All 23 · Shared 5". */
export function FilterChips<K extends string>({
  options,
  value,
  onChange,
}: {
  options: { key: K; label: string; count: number }[];
  value: K;
  onChange: (key: K) => void;
}) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
      {options.map((option) => {
        const selected = value === option.key;
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.key)}
            className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              selected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-surface text-foreground-muted hover:border-border-strong hover:text-foreground"
            }`}
          >
            {option.label}
            <span className="tabular-nums opacity-70">{option.count}</span>
          </button>
        );
      })}
    </div>
  );
}

/** "Showing 8 of 23" and a button that fetches the next 8 from the server. */
export function LoadMore({
  shown,
  total,
  hasMore,
  loading,
  onClick,
}: {
  shown: number;
  total: number;
  hasMore: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  const t = useTranslations("pages.reports");
  if (!hasMore) return null;
  return (
    <div className="flex flex-col items-center gap-2 pt-1">
      <p className="text-xs text-foreground-muted">
        {t("showingOf", { shown, total })}
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={onClick}
        disabled={loading}
        className="w-full sm:w-auto"
      >
        {loading ? <Loader2 className="animate-spin" /> : <ChevronDown />}
        {t("loadMore")}
      </Button>
    </div>
  );
}
