import type { ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/app/lib/utils";

/**
 * Pill: rounded announcement badge (optionally with a live pulse dot).
 * Tag: small square-ish mono chip for statuses.
 */
const badgeVariants = cva("inline-flex shrink-0 items-center font-mono", {
  variants: {
    variant: {
      pill: "gap-2 rounded-full border border-border bg-surface-raised/90 px-4 py-1.5 text-xs text-primary-hover",
      live: "gap-1.5 rounded-[5px] border border-success/25 bg-success/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-success",
      soon: "gap-1.5 rounded-[5px] border border-gold/25 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-gold",
      info: "gap-1.5 rounded-[5px] border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-primary",
      danger:
        "gap-1.5 rounded-[5px] border border-destructive/25 bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-destructive",
      neutral:
        "gap-1.5 rounded-[5px] border border-border bg-surface-raised px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground-muted",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export function Badge({
  children,
  variant,
  pulse = false,
  className,
}: {
  children: ReactNode;
  pulse?: boolean;
  className?: string;
} & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)}>
      {pulse && <span className="pulse-dot" aria-hidden />}
      {children}
    </span>
  );
}
