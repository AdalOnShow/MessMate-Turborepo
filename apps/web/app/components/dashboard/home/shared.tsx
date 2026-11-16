import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/app/lib/utils";

export type Tone = "success" | "destructive" | "neutral";

export function balanceTone(balance: number): Tone {
  return balance > 0 ? "success" : balance < 0 ? "destructive" : "neutral";
}

export const toneText: Record<Tone, string> = {
  success: "text-success",
  destructive: "text-destructive",
  neutral: "text-foreground",
};

/** Plain dashboard card: flat surface, soft border, roomy radius. */
export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-surface p-4 sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

/** Section title row with an optional "see more" link on the right. */
export function CardTitle({
  title,
  href,
  linkLabel,
  badge,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  badge?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {title}
        {badge}
      </h2>
      {href && linkLabel ? (
        <Link
          href={href}
          className="-mr-1 flex items-center gap-0.5 rounded-md px-1 text-xs font-medium text-foreground-muted transition-colors hover:text-primary"
        >
          {linkLabel}
          <ChevronRight size={14} aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}
