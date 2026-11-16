"use client";

import { useLinkStatus } from "next/link";
import { cn } from "../../lib/utils";

/**
 * Must be rendered inside a `<Link>`. Shows a small pulsing dot while that
 * link's navigation is in flight, so the tapped item reacts instantly.
 */
export function LinkPendingDot({ className }: { className?: string }) {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none size-1.5 rounded-full bg-primary transition-opacity duration-150",
        pending ? "animate-pulse opacity-100 delay-100" : "opacity-0",
        className,
      )}
    />
  );
}
