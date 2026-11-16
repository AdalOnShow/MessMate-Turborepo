import { cn } from "../../lib/utils";

/** Shimmering placeholder block for content that is still loading. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("skeleton rounded-lg bg-surface-raised", className)}
    />
  );
}
