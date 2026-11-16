import type { ReactNode } from "react";
import { cn } from "@/app/lib/utils";

/** Bordered panel with an editor-style title bar (traffic-light dots + mono title). */
export function WindowPanel({
  title,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-surface shadow-panel",
        className,
      )}
    >
      <div className="flex items-center gap-3 border-b border-border bg-surface-raised px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full border border-destructive/40 bg-destructive" />
          <span className="size-2.5 rounded-full border border-accent-warm/40 bg-accent-warm" />
          <span className="size-2.5 rounded-full border border-success/40 bg-success" />
        </div>
        {title && (
          <span className="truncate font-mono text-[11px] tracking-wide text-foreground-muted">
            {title}
          </span>
        )}
        {actions && (
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        )}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
